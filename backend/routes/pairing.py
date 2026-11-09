"""Separate, long-lived device pairing for the elderly kiosk/tablet session."""

from __future__ import annotations

import asyncio
import base64
from collections import defaultdict, deque
import hashlib
import io
import json
import logging
import os
import re
import secrets
import threading
import time
import wave
from datetime import date, datetime, timedelta, timezone
from typing import Annotated, Any
from uuid import UUID
from uuid import uuid4

from fastapi import APIRouter, Header, HTTPException, Query, Request
from pydantic import BaseModel, ConfigDict, Field

from backend.middleware.auth import CurrentUser
from backend.services.ai.orchestrator import voice_orchestrator
from backend.services.ai.response_generator import configured_ai_mode
from backend.services.ai.providers.gnani import GnaniAPIError, GnaniConfigurationError, GnaniProvider
from backend.services.ai.summary_generator import summarize_voice_day
from backend.services.supabase import request_json, rest_table_path
from backend.utils.device_tokens import generate_device_token, hash_device_token, hash_pairing_code

router = APIRouter(prefix="/pairing", tags=["elder device pairing"])
voice_router = APIRouter(prefix="/voice", tags=["voice assistant"])
caregiver_voice_router = APIRouter(prefix="/caregiver", tags=["caregiver voice insights"])
logger = logging.getLogger("smritivani.voice")
PAIRING_TTL = timedelta(minutes=15)
_PAIR_RATE_LOCK = threading.Lock()
_PAIR_ATTEMPTS: dict[str, deque[float]] = defaultdict(deque)
DEVICE_RESOURCES = {
    "contacts": ("elder_contacts", "created_at desc"), "memories": ("memories", "created_at desc"),
    "events": ("events", "starts_at asc"), "medicines": ("medicines", "created_at asc"),
    "medicine-logs": ("medicine_logs", "scheduled_for desc"), "daily-logs": ("daily_logs", "log_date desc"),
    "voice-notes": ("voice_notes", "created_at desc"), "alerts": ("alerts", "created_at desc"),
    "conversations": ("conversations", "started_at desc"), "messages": ("conversation_messages", "created_at desc"),
}
DEVICE_WRITABLE = {
    "medicine-logs": {"medicine_id", "scheduled_for", "status", "note"},
    "alerts": {"type", "transcript"},
}


class PairingCodeRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    claim_code: str = Field(pattern=r"^\d{4,6}$")


class VoiceTextRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    text: str = Field(min_length=1, max_length=4000)
    session_id: UUID | None = None
    language: str = Field(default="hi-IN", max_length=40)


class UnpairRequest(BaseModel):
    model_config = ConfigDict(extra="forbid")
    elder_id: UUID


def _db(request: Request):
    pool = getattr(request.app.state, "database", None)
    if pool is None:
        raise HTTPException(status_code=503, detail="Database service is not available.")
    return pool


def _set_auth_user(cursor, user_id: str) -> None:
    """Set transaction-local Supabase auth claims after the JWT was verified."""
    cursor.execute("select set_config('request.jwt.claim.sub', %s, true)", (user_id,))
    cursor.execute("select set_config('request.jwt.claim.role', 'authenticated', true)")


async def _run_db(request: Request, operation):
    pool = _db(request)
    try:
        return await asyncio.to_thread(operation, pool)
    except HTTPException:
        raise
    except Exception as exc:
        # Driver error strings may contain SQL details; do not expose them.
        sqlstate = getattr(exc, "sqlstate", None)
        primary_message = getattr(getattr(exc, "diag", None), "message_primary", None)
        logger.error(
            "pairing_or_voice_database_operation_failed error_type=%s sqlstate=%s database_message=%s",
            type(exc).__name__, sqlstate or "n/a", primary_message or "n/a",
        )
        raise HTTPException(status_code=503, detail="The pairing service could not complete this request.") from None


@router.post("/codes", status_code=201, summary="Issue a short-lived device pairing code")
async def issue_code(elder_id: UUID, request: Request, user: CurrentUser) -> dict[str, Any]:
    code = f"{secrets.randbelow(1_000_000):06d}"
    try:
        code_hash = hash_pairing_code(code)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    expires = datetime.now(timezone.utc) + PAIRING_TTL

    def issue(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                _set_auth_user(cursor, user["id"])
                cursor.execute("select private.has_elder_role(%s, array['admin','caregiver'])", (str(elder_id),))
                if not cursor.fetchone()[0]:
                    raise HTTPException(status_code=404, detail="Care profile not found or not accessible.")
                cursor.execute("update public.elder_device_codes set consumed_at=clock_timestamp() where elder_id=%s and consumed_at is null", (str(elder_id),))
                cursor.execute("insert into public.elder_device_codes(elder_id,code_hash,issued_by_user_id,expires_at) values(%s,%s,%s,%s)", (str(elder_id), code_hash, user["id"], expires))
        return None

    await _run_db(request, issue)
    return {"elder_id": str(elder_id), "claim_code": code, "expires_at": expires.isoformat(), "expires_in_seconds": int(PAIRING_TTL.total_seconds())}


@router.post("/verify", summary="Pair an elderly device using a caregiver-issued code")
async def verify_pairing(body: PairingCodeRequest, request: Request) -> dict[str, Any]:
    client_key = request.client.host if request.client else "unknown"
    now = datetime.now(timezone.utc).timestamp()
    with _PAIR_RATE_LOCK:
        attempts = _PAIR_ATTEMPTS[client_key]
        while attempts and now - attempts[0] > 900:
            attempts.popleft()
        if len(attempts) >= 10:
            raise HTTPException(status_code=429, detail="Too many code attempts. Please wait 15 minutes or ask your caregiver for help.")
        attempts.append(now)
    try:
        code_hash = hash_pairing_code(body.claim_code)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    token = generate_device_token()
    token_hash = hash_device_token(token)
    ua = request.headers.get("user-agent", "")[:500] or None

    def verify(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select id, elder_id, expires_at from public.elder_device_codes where code_hash=%s and consumed_at is null for update", (code_hash,))
                row = cursor.fetchone()
                if not row or row[2] <= datetime.now(timezone.utc):
                    raise HTTPException(status_code=400, detail="That code is incorrect or has expired. Ask your caregiver for a new one.")
                code_id, elder_id = row[0], row[1]
                cursor.execute("insert into public.paired_devices(elder_id,device_token_hash,user_agent) values(%s,%s,%s) returning id", (elder_id, token_hash, ua))
                device_id = cursor.fetchone()[0]
                cursor.execute("update public.elder_device_codes set consumed_at=clock_timestamp() where id=%s", (code_id,))
                cursor.execute("select id,name,age,language,city,timezone from public.elders where id=%s", (elder_id,))
                profile = cursor.fetchone()
                if not profile:
                    raise HTTPException(status_code=400, detail="That code is incorrect or has expired.")
                keys = ("id", "name", "age", "language", "city", "timezone")
                return token, dict(zip(keys, profile)), str(device_id)

    token, profile, device_id = await _run_db(request, verify)
    return {"device_token": token, "device_id": device_id, "elderly_profile": profile}


@router.get("/devices", summary="List paired devices for a caregiver-owned profile")
async def list_paired_devices(elder_id: UUID, request: Request, user: CurrentUser) -> dict[str, Any]:
    def read(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                _set_auth_user(cursor, user["id"])
                cursor.execute("select private.has_elder_role(%s, array['admin','caregiver'])", (str(elder_id),))
                if not cursor.fetchone()[0]:
                    raise HTTPException(status_code=404, detail="Care profile not found or not accessible.")
                cursor.execute("select id,user_agent,first_paired_at,last_seen_at,is_active from public.paired_devices where elder_id=%s order by first_paired_at desc", (str(elder_id),))
                columns = [column.name for column in cursor.description]
                return [dict(zip(columns, row)) for row in cursor.fetchall()]
    return {"items": await _run_db(request, read)}


@router.post("/unpair", summary="Revoke all paired devices for a care profile")
async def caregiver_unpair_devices(body: UnpairRequest, request: Request, user: CurrentUser) -> dict[str, int]:
    def revoke(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                _set_auth_user(cursor, user["id"])
                cursor.execute("select private.has_elder_role(%s, array['admin','caregiver'])", (str(body.elder_id),))
                if not cursor.fetchone()[0]:
                    raise HTTPException(status_code=404, detail="Care profile not found or not accessible.")
                cursor.execute("update public.paired_devices set is_active=false where elder_id=%s and is_active=true", (str(body.elder_id),))
                revoked_devices = cursor.rowcount
                cursor.execute("update public.elder_device_codes set consumed_at=clock_timestamp() where elder_id=%s and consumed_at is null", (str(body.elder_id),))
                return revoked_devices
    return {"revoked_devices": await _run_db(request, revoke)}


def _device_token(value: str | None) -> str:
    if not value or len(value) > 200:
        raise HTTPException(status_code=401, detail="This device is not paired. Enter the code from your caregiver.")
    return hash_device_token(value)


async def resolve_device(request: Request, device_token: str | None) -> dict[str, Any]:
    token_hash = _device_token(device_token)

    def resolve(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("update public.paired_devices set last_seen_at=clock_timestamp() where device_token_hash=%s and is_active=true returning elder_id", (token_hash,))
                row = cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=401, detail="This device pairing has expired. Ask your caregiver to pair it again.")
                elder_id = str(row[0])
                cursor.execute("select id,name,age,language,city,timezone from public.elders where id=%s", (elder_id,))
                profile = cursor.fetchone()
                keys = ("id", "name", "age", "language", "city", "timezone")
                return {"elderly_profile": dict(zip(keys, profile)) if profile else None}

    return await _run_db(request, resolve)


@router.get("/profile", summary="Read the paired elderly profile")
async def paired_profile(request: Request, x_device_token: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    result = await resolve_device(request, x_device_token)
    if not result["elderly_profile"]:
        raise HTTPException(status_code=404, detail="The paired care profile no longer exists.")
    return result


@router.get("/resources", summary="Read several resources for the paired elderly profile")
async def paired_resources(
    request: Request,
    resources: str = Query("", max_length=400),
    x_device_token: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    requested = list(dict.fromkeys(part.strip() for part in resources.split(",") if part.strip()))
    unknown = [resource for resource in requested if resource not in DEVICE_RESOURCES]
    if unknown:
        raise HTTPException(status_code=404, detail="Unknown care resource.")
    token_hash = _device_token(x_device_token)

    # Resource/table/order values come only from the server-owned allowlist above.
    resource_sql = []
    params: list[Any] = []
    for resource in requested:
        table, order = DEVICE_RESOURCES[resource]
        resource_sql.append(
            "%s::text, coalesce((select jsonb_agg(to_jsonb(r)) from "
            f"(select * from public.{table} where elder_id=e.id order by {order} limit 100) r), '[]'::jsonb)"
        )
        params.append(resource)

    data_expression = f"jsonb_build_object({', '.join(resource_sql)})" if resource_sql else "'{}'::jsonb"
    query = f"""
        select
            jsonb_build_object(
                'id', e.id, 'name', e.name, 'age', e.age,
                'language', e.language, 'city', e.city, 'timezone', e.timezone
            ) as elderly_profile,
            {data_expression} as data
        from public.elders e
        where e.id=%s
    """
    result = await _run_db(request, lambda pool: _fetch_paired_resources(pool, query, params, token_hash))
    if not result[0]:
        raise HTTPException(status_code=401, detail="This device pairing has expired. Ask your caregiver to pair it again.")
    return {"elderly_profile": result[0], "data": result[1] or {}}


def _fetch_paired_resources(pool, query: str, params: list[Any], token_hash: str) -> tuple[dict[str, Any] | None, dict[str, Any]]:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                "update public.paired_devices set last_seen_at=clock_timestamp() "
                "where device_token_hash=%s and is_active=true returning elder_id",
                (token_hash,),
            )
            paired = cursor.fetchone()
            if not paired:
                return None, {}
            params.append(str(paired[0]))
            cursor.execute(query, params)
            row = cursor.fetchone()
            return (row[0], row[1]) if row else (None, {})


@router.get("/resources/{resource}", summary="Read records for the paired elderly profile")
async def paired_resource(resource: str, request: Request, x_device_token: Annotated[str | None, Header()] = None, limit: int = 100, offset: int = 0) -> dict[str, Any]:
    if resource not in DEVICE_RESOURCES:
        raise HTTPException(status_code=404, detail="Unknown care resource.")
    if not 1 <= limit <= 500 or offset < 0:
        raise HTTPException(status_code=422, detail="Invalid page size or offset.")
    paired = await resolve_device(request, x_device_token)
    elder_id = paired["elderly_profile"]["id"]
    table, order = DEVICE_RESOURCES[resource]
    def read(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute(f"select * from public.{table} where elder_id=%s order by {order} limit %s offset %s", (elder_id, limit, offset))
                names = [column.name for column in cursor.description]
                return [dict(zip(names, row)) for row in cursor.fetchall()]
    rows = await _run_db(request, read)
    return {"items": rows, "limit": limit, "offset": offset}


@router.post("/resources/{resource}", status_code=201, summary="Record a patient medicine update or SOS alert")
async def create_paired_resource(resource: str, request: Request, body: dict[str, Any], x_device_token: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    if resource not in DEVICE_WRITABLE:
        raise HTTPException(status_code=403, detail="This care record can only be changed by a caregiver.")
    data = body.get("data")
    if not isinstance(data, dict) or not data or set(data) - DEVICE_WRITABLE[resource]:
        raise HTTPException(status_code=422, detail="The care record contains missing or unsupported fields.")
    if resource == "medicine-logs":
        if data.get("status") not in {"taken", "missed", "skipped"}:
            raise HTTPException(status_code=422, detail="Choose taken, missed, or skipped for a medicine update.")
        if not data.get("medicine_id") or not data.get("scheduled_for"):
            raise HTTPException(status_code=422, detail="Medicine and scheduled time are required.")
    if resource == "alerts" and data.get("type") not in {"fall", "distress", "confusion", "medical", "other"}:
        raise HTTPException(status_code=422, detail="Choose a supported alert type.")
    paired = await resolve_device(request, x_device_token)
    elder_id = paired["elderly_profile"]["id"]
    table = DEVICE_RESOURCES[resource][0]
    fields = ["elder_id", *data.keys()]
    values = [elder_id, *data.values()]
    columns = ", ".join(fields)
    placeholders = ", ".join(["%s"] * len(values))
    def insert(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                if resource == "medicine-logs":
                    cursor.execute("select id from public.medicines where id=%s and elder_id=%s", (str(data["medicine_id"]), elder_id))
                    if not cursor.fetchone():
                        raise HTTPException(status_code=422, detail="That medicine is not part of this care profile.")
                cursor.execute(f"insert into public.{table}({columns}) values({placeholders}) returning *", values)
                row = cursor.fetchone()
                return dict(zip([column.name for column in cursor.description], row))
    return await _run_db(request, insert)


@router.delete("/device", status_code=204, summary="Unpair this elderly device")
async def unpair_device(request: Request, x_device_token: Annotated[str | None, Header()] = None):
    token_hash = _device_token(x_device_token)
    def unpair(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("update public.paired_devices set is_active=false where device_token_hash=%s", (token_hash,))
    await _run_db(request, unpair)


@voice_router.post("/text", summary="Process browser-recognized speech text")
async def process_text(body: VoiceTextRequest, request: Request, x_device_token: Annotated[str | None, Header()] = None) -> dict[str, Any]:
    paired = await resolve_device(request, x_device_token)
    profile = paired["elderly_profile"] or {}
    return await _process_voice_text(body, request, profile, asr_provider="browser")


async def _process_voice_text(body: VoiceTextRequest, request: Request, profile: dict[str, Any], *, asr_provider: str) -> dict[str, Any]:
    history = await _run_db(request, lambda pool: _recent_messages(pool, str(profile.get("id", ""))))
    care_context = await _run_db(request, lambda pool: _care_context(pool, str(profile.get("id", ""))))
    try:
        response = await voice_orchestrator.process_text(
            body.text,
            str(profile.get("id", "")),
            str(body.session_id) if body.session_id else None,
            body.language,
            str(profile.get("name", "")),
            history,
            care_context,
            asr_provider=asr_provider,
        )
    except ValueError as exc:
        raise HTTPException(status_code=422, detail=str(exc)) from None
    result = response.to_dict()
    elder_id = str(profile.get("id", ""))
    logger.info(
        "voice_interaction request_id=%s elder_hash=%s intent=%s confidence=%.2f provider=%s latency_ms=%d emergency=%s",
        uuid4(), hashlib.sha256(elder_id.encode("utf-8")).hexdigest()[:12],
        result["intent"]["intent"], float(result["intent"].get("confidence") or 0),
        result["providers_used"].get("llm", "unknown"), result["latency_ms"], result["emergency"]["is_emergency"],
    )
    interaction_id = await _run_db(request, lambda pool: _persist_voice(pool, elder_id, body, result, asr_provider))
    result["interaction_id"] = interaction_id
    # Persist the interaction (and any safety alert) before a potentially slow
    # speech vendor call. TTS must never delay emergency alert creation.
    tts_started = time.perf_counter()
    try:
        audio_bytes = await GnaniProvider().synthesize(result["assistant_text"], language=body.language)
        result["assistant_audio_base64"] = base64.b64encode(audio_bytes).decode("ascii")
        result["audio_mime"] = "audio/wav"
        result["providers_used"]["tts"] = "gnani"
    except (GnaniConfigurationError, GnaniAPIError) as exc:
        logger.warning("voice_tts_unavailable error_type=%s", type(exc).__name__)
        result["providers_used"]["tts"] = "browser"
        result["warnings"].append("Gnani speech output is unavailable; browser speech fallback will be used.")
        result["degraded_mode"] = True
    except Exception as exc:
        logger.warning("voice_tts_unavailable error_type=%s", type(exc).__name__)
        result["providers_used"]["tts"] = "browser"
        result["warnings"].append("Gnani speech output is unavailable; browser speech fallback will be used.")
        result["degraded_mode"] = True
    result["latency_ms"] += round((time.perf_counter() - tts_started) * 1000)
    try:
        await _run_db(request, lambda pool: _update_voice_tts(pool, interaction_id, result["providers_used"]["tts"], result["latency_ms"]))
    except Exception as exc:
        logger.warning("voice_tts_metadata_update_failed error_type=%s", type(exc).__name__)
    return result


def _update_voice_tts(pool, interaction_id: str, provider: str, latency_ms: int) -> None:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("update public.voice_interactions set tts_provider=%s,latency_ms=%s where id=%s", (provider, latency_ms, interaction_id))


def _recent_messages(pool, elder_id: str) -> list[dict[str, str]]:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            # Local canned replies are not useful dialogue history and can make
            # the model repeat the same fallback suggestions on every turn.
            cursor.execute("select transcript,assistant_response from public.voice_interactions where elder_id=%s and llm_provider in ('groq','gemini') and not is_emergency order by created_at desc limit 3", (elder_id,))
            rows = list(reversed(cursor.fetchall()))
    messages: list[dict[str, str]] = []
    for transcript, assistant_response in rows:
        # Drop old generic feature suggestions (for example, unsolicited event
        # or bhajan menus) so they cannot bias the next conversational reply.
        feature_mention = re.compile(r"\b(events?|schedules?|appointments?|bhajans?|aarti|music)\b", re.IGNORECASE)
        if feature_mention.search(str(assistant_response or "")) and not feature_mention.search(str(transcript or "")):
            continue
        messages.extend(({"role": "user", "content": str(transcript)[:4000]}, {"role": "assistant", "content": str(assistant_response)[:4000]}))
    return messages[-6:]


def _care_context(pool, elder_id: str) -> str:
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute("select type,name,relationship,info from public.memories where elder_id=%s and type in ('family','preference','fact') order by created_at desc limit 8", (elder_id,))
            rows = cursor.fetchall()
    parts = []
    for memory_type, name, relationship, info in rows:
        safe_info = str(info or "")
        if memory_type == "family":
            safe_info = " ".join(line for line in safe_info.splitlines() if not line.lower().startswith(("phone:", "city:")))
        safe_info = re.sub(r"\+?\d[\d\s().-]{7,}\d", "[phone removed]", safe_info)
        details = ", ".join(str(value).strip() for value in (name, relationship, safe_info) if value)
        if details: parts.append(details[:220])
    return "; ".join(parts)


@voice_router.post("/process", summary="Transcribe a short recording with Gnani and process the transcript")
async def process_audio(
    request: Request,
    language_code: str = Query("hi-IN", min_length=2, max_length=32),
    x_device_token: Annotated[str | None, Header()] = None,
) -> dict[str, Any]:
    paired = await resolve_device(request, x_device_token)
    content_type = request.headers.get("content-type", "").split(";", 1)[0].strip().lower()
    if content_type not in {"audio/wav", "audio/x-wav", "audio/wave"}:
        raise HTTPException(status_code=415, detail="Send a WAV recording. The browser recorder converts microphone audio to WAV before upload.")

    content_length = request.headers.get("content-length")
    if content_length and content_length.isdigit() and int(content_length) > 10 * 1024 * 1024:
        raise HTTPException(status_code=413, detail="The recording is too large. Please use a shorter voice message.")
    audio = bytearray()
    async for chunk in request.stream():
        audio.extend(chunk)
        if len(audio) > 10 * 1024 * 1024:
            raise HTTPException(status_code=413, detail="The recording is too large. Please use a shorter voice message.")
    if not audio:
        raise HTTPException(status_code=422, detail="The audio recording is empty.")
    try:
        with wave.open(io.BytesIO(audio), "rb") as wav_file:
            frame_rate = wav_file.getframerate()
            duration_seconds = wav_file.getnframes() / frame_rate if frame_rate else 0
    except (wave.Error, EOFError):
        raise HTTPException(status_code=422, detail="The uploaded WAV recording is invalid.") from None
    if duration_seconds <= 0:
        raise HTTPException(status_code=422, detail="The uploaded WAV recording has no audio frames.")
    if duration_seconds > 30:
        raise HTTPException(status_code=422, detail="Gnani accepts recordings up to 30 seconds. Please send a shorter recording.")

    try:
        transcript = await GnaniProvider().transcribe(bytes(audio), language=language_code)
    except GnaniConfigurationError as exc:
        raise HTTPException(status_code=503, detail=str(exc)) from None
    except GnaniAPIError as exc:
        status_code = 429 if exc.status_code == 429 else 422 if exc.status_code in {400, 422} else 502
        raise HTTPException(status_code=status_code, detail=str(exc)) from None
    if not transcript.text:
        raise HTTPException(status_code=422, detail="No speech was detected. Please speak closer to the microphone and try again.")

    profile = paired["elderly_profile"] or {}
    # Use the language selected in the elder profile for the reply and voice.
    # Keep Gnani's detected language separately for diagnostics/transcript display.
    voice_text = VoiceTextRequest(text=transcript.text, language=language_code)
    result = await _process_voice_text(voice_text, request, profile, asr_provider="gnani")
    result["transcript"] = transcript.text
    result["transcript_language"] = transcript.language
    result["asr_model"] = transcript.metadata.get("model")
    return result


def _persist_voice(pool, elder_id: str, body: VoiceTextRequest, result: dict[str, Any], asr_provider: str) -> str:
    intent, sentiment, emergency = result["intent"], result["sentiment"], result["emergency"]
    with pool.connection() as connection:
        with connection.cursor() as cursor:
            cursor.execute(
                """insert into public.voice_interactions
                   (elder_id,session_id,transcript,transcript_lang,transcript_confidence,intent,intent_confidence,
                    sentiment,sentiment_score,is_emergency,emergency_terms,assistant_response,action_type,
                    action_target,asr_provider,tts_provider,llm_provider,latency_ms)
                   values(%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s,%s) returning id""",
                (elder_id, str(body.session_id) if body.session_id else None, result["transcript"], body.language,
                 None, intent["intent"], intent.get("confidence"), sentiment["label"], sentiment["score"],
                 emergency["is_emergency"], emergency["terms"], result["assistant_text"], result["action"]["type"],
                 result["action"]["target"], asr_provider, result["providers_used"].get("tts", "browser"), result["providers_used"].get("llm", "local_rules"), result["latency_ms"]),
            )
            interaction_id = str(cursor.fetchone()[0])
            if emergency["is_emergency"]:
                severity = emergency["severity"] if emergency["severity"] in {"low", "medium", "high", "critical"} else "high"
                cursor.execute(
                    "insert into public.safety_alerts(elder_id,voice_interaction_id,severity,alert_type,transcript,detected_terms) values(%s,%s,%s,'voice_emergency',%s,%s)",
                    (elder_id, interaction_id, severity, result["transcript"][:12000], emergency["terms"]),
                )
                # The caregiver UI currently reads this established alert table.
                cursor.execute("insert into public.alerts(elder_id,type,transcript) values(%s,'distress',%s)", (elder_id, result["transcript"][:12000]))
    return interaction_id


@voice_router.get("/status", summary="Show AI provider readiness without secrets")
async def voice_status() -> dict[str, Any]:
    mode = configured_ai_mode()
    configured = ["local_rules", "browser_speech_synthesis"]
    degraded = []
    if mode in {"groq", "hybrid"}:
        if os.getenv("GEMINI_API_KEY", "").strip(): configured.append("gemini")
        if os.getenv("GROQ_API_KEY", "").strip(): configured.append("groq")
        if mode == "groq" and "groq" not in configured or mode == "hybrid" and not {"gemini", "groq"}.intersection(configured): degraded.append("llm")
    else:
        degraded.append("llm")
    if os.getenv("GNANI_API_KEY", "").strip():
        configured.extend(("gnani_stt_configured", "gnani_tts_configured"))
    else:
        degraded.extend(("gnani_stt", "gnani_tts"))
    return {"ai_mode": mode, "configured_providers": configured, "degraded_services": degraded, "requires_api_keys": bool(degraded)}


@voice_router.get("/history", summary="List recent voice interactions for the paired profile")
async def voice_history(request: Request, x_device_token: Annotated[str | None, Header()] = None, limit: int = 20) -> dict[str, Any]:
    if not 1 <= limit <= 100:
        raise HTTPException(status_code=422, detail="Limit must be between 1 and 100.")
    paired = await resolve_device(request, x_device_token)
    elder_id = paired["elderly_profile"]["id"]
    def read(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select id,transcript,intent,sentiment,is_emergency,assistant_response,action_type,action_target,latency_ms,created_at from public.voice_interactions where elder_id=%s order by created_at desc limit %s", (elder_id, limit))
                rows = cursor.fetchall()
                columns = ("id", "transcript", "intent", "sentiment", "is_emergency", "assistant_response", "action_type", "action_target", "latency_ms", "created_at")
                return [dict(zip(columns, row)) for row in rows]
    rows = await _run_db(request, read)
    return {"items": rows}


@caregiver_voice_router.get("/elders/{elder_id}/interactions", summary="List voice interactions visible to this caregiver")
async def caregiver_interactions(elder_id: UUID, user: CurrentUser, date_filter: date | None = Query(default=None, alias="date"), limit: int = Query(50, ge=1, le=100)) -> dict[str, Any]:
    params = {"elder_id": f"eq.{elder_id}", "select": "*", "order": "created_at.desc", "limit": str(limit)}
    if date_filter:
        start = datetime.combine(date_filter, datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        params["created_at"] = f"gte.{start.isoformat()}"
        params["and"] = f"(created_at.lt.{end.isoformat()})"
    rows = await request_json("GET", rest_table_path("voice_interactions"), token=user["access_token"], params=params)
    return {"items": rows, "limit": limit}


@caregiver_voice_router.get("/dashboard", summary="Load caregiver dashboard data in one authorized request")
async def caregiver_dashboard(
    request: Request,
    user: CurrentUser,
    elder_id: UUID | None = None,
    include_data: bool = True,
) -> dict[str, Any]:
    """Return the caregiver dashboard in one API request and one data query."""
    def read_dashboard(pool) -> dict[str, Any]:
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                _set_auth_user(cursor, user["id"])
                cursor.execute(
                    """
                    with selected_elder as (
                        select e.id, e.name, e.age, e.city, e.lives_alone, e.language, e.doctor_name, e.doctor_phone
                        from public.elders e
                        where (
                            (%s::uuid is not null and e.id=%s::uuid
                                and private.has_elder_role(e.id,array['admin','caregiver']))
                            or (%s::uuid is null and e.id=(
                                select m.elder_id from public.elder_memberships m
                                where m.user_id=%s::uuid and m.status='active'
                                  and m.role in ('admin','caregiver')
                                order by m.created_at asc limit 1
                            ))
                        )
                        limit 1
                    )
                    select
                        to_jsonb(e) as elder,
                        case when %s then jsonb_build_object(
                            'events', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select * from public.events where elder_id=e.id order by starts_at asc limit 100
                            ) x), '[]'::jsonb),
                            'medicines', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select * from public.medicines where elder_id=e.id order by created_at asc limit 100
                            ) x), '[]'::jsonb),
                            'medicine-logs', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select * from public.medicine_logs where elder_id=e.id order by scheduled_for desc limit 100
                            ) x), '[]'::jsonb),
                            'memories', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select * from public.memories where elder_id=e.id order by created_at desc limit 100
                            ) x), '[]'::jsonb),
                            'daily-logs', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select * from public.daily_logs where elder_id=e.id order by log_date desc limit 30
                            ) x), '[]'::jsonb),
                            'alerts', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select id,status,created_at,type from public.alerts where elder_id=e.id order by created_at desc limit 100
                            ) x), '[]'::jsonb),
                            'voice-notes', coalesce((select jsonb_agg(to_jsonb(x)) from (
                                select id,transcript,created_at from public.voice_notes where elder_id=e.id order by created_at desc limit 10
                            ) x), '[]'::jsonb)
                        ) else '{}'::jsonb end as data,
                        jsonb_build_object(
                            'count', (select count(*) from public.voice_interactions where elder_id=e.id),
                            'last_active', coalesce((select to_jsonb(created_at) from public.voice_interactions where elder_id=e.id order by created_at desc limit 1), to_jsonb(''::text)),
                            'pending_alerts', (select count(*) from public.safety_alerts where elder_id=e.id and status='pending'),
                            'open_alerts', (select count(*) from public.alerts where elder_id=e.id and status='open'),
                            'mood', coalesce((select sentiment from public.voice_interactions where elder_id=e.id order by created_at desc limit 1), '')
                        ) as voice_stats,
                        (select to_jsonb(d) from (
                            select id,first_paired_at,last_seen_at,is_active from public.paired_devices
                            where elder_id=e.id and is_active=true order by first_paired_at desc limit 1
                        ) d) as paired_device
                    from selected_elder e
                    """,
                    (str(elder_id) if elder_id else None, str(elder_id) if elder_id else None,
                     str(elder_id) if elder_id else None, user["id"], include_data),
                )
                result = cursor.fetchone()
                if not result:
                    raise HTTPException(status_code=404, detail="Care profile not found or not accessible.")
                return {"elder": result[0], "data": result[1], "voice_stats": result[2], "paired_device": result[3]}

    return await _run_db(request, read_dashboard)


@caregiver_voice_router.get("/elders/{elder_id}/alerts", summary="List safety alerts visible to this caregiver")
async def caregiver_alerts(elder_id: UUID, user: CurrentUser, status: str | None = None, limit: int = Query(100, ge=1, le=500)) -> dict[str, Any]:
    params = {"elder_id": f"eq.{elder_id}", "select": "*", "order": "created_at.desc", "limit": str(limit)}
    if status:
        if status not in {"pending", "acknowledged", "resolved", "false_positive"}:
            raise HTTPException(status_code=422, detail="Unknown alert status.")
        params["status"] = f"eq.{status}"
    rows = await request_json("GET", rest_table_path("safety_alerts"), token=user["access_token"], params=params)
    return {"items": rows, "limit": limit}


async def _update_safety_alert(request: Request, alert_id: UUID, user: dict[str, str], status: str) -> dict[str, Any]:
    def update(pool):
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                cursor.execute("select elder_id from public.safety_alerts where id=%s", (str(alert_id),))
                row = cursor.fetchone()
                if not row:
                    raise HTTPException(status_code=404, detail="Safety alert not found.")
                _set_auth_user(cursor, user["id"])
                cursor.execute("select private.has_elder_role(%s, array['admin','caregiver'])", (str(row[0]),))
                if not cursor.fetchone()[0]:
                    raise HTTPException(status_code=404, detail="Safety alert not found.")
                cursor.execute("update public.safety_alerts set status=%s, acknowledged_by=case when %s='acknowledged' then %s::uuid else acknowledged_by end, acknowledged_at=case when %s='acknowledged' then clock_timestamp() else acknowledged_at end where id=%s returning id,status,acknowledged_by,acknowledged_at", (status, status, user["id"], status, str(alert_id)))
                result = cursor.fetchone()
                return {"id": str(result[0]), "status": result[1], "acknowledged_by": str(result[2]) if result[2] else None, "acknowledged_at": result[3].isoformat() if result[3] else None}
    return await _run_db(request, update)


@caregiver_voice_router.post("/alerts/{alert_id}/acknowledge", summary="Acknowledge a safety alert")
async def acknowledge_alert(alert_id: UUID, request: Request, user: CurrentUser) -> dict[str, Any]:
    return await _update_safety_alert(request, alert_id, user, "acknowledged")


@caregiver_voice_router.post("/alerts/{alert_id}/resolve", summary="Resolve a safety alert")
async def resolve_alert(alert_id: UUID, request: Request, user: CurrentUser) -> dict[str, Any]:
    return await _update_safety_alert(request, alert_id, user, "resolved")


@caregiver_voice_router.post("/alerts/{alert_id}/false-positive", summary="Mark a safety alert as a false positive")
async def false_positive_alert(alert_id: UUID, request: Request, user: CurrentUser) -> dict[str, Any]:
    return await _update_safety_alert(request, alert_id, user, "false_positive")


@caregiver_voice_router.get("/elders/{elder_id}/daily-summary", summary="Generate or retrieve a daily voice summary")
async def daily_summary(elder_id: UUID, summary_date: date, request: Request, user: CurrentUser) -> dict[str, Any]:
    def summarize(pool):
        start = datetime.combine(summary_date, datetime.min.time(), tzinfo=timezone.utc)
        end = start + timedelta(days=1)
        with pool.connection() as connection:
            with connection.cursor() as cursor:
                _set_auth_user(cursor, user["id"])
                cursor.execute("select private.has_elder_role(%s, array['admin','caregiver'])", (str(elder_id),))
                if not cursor.fetchone()[0]:
                    raise HTTPException(status_code=404, detail="Care profile not found or not accessible.")
                cursor.execute("select intent,sentiment_score,assistant_response,created_at from public.voice_interactions where elder_id=%s and created_at >= %s and created_at < %s order by created_at asc", (str(elder_id), start, end))
                rows = cursor.fetchall()
                cursor.execute("select count(*), count(*) filter (where status='taken') from public.medicine_logs where elder_id=%s and scheduled_for >= %s and scheduled_for < %s", (str(elder_id), start, end))
                medicine_total, medicine_taken = cursor.fetchone()
                summary = summarize_voice_day(rows, medicine_total, medicine_taken)
                cursor.execute("insert into public.daily_summaries(elder_id,summary_date,mood_score,mood_label,medicine_compliance_pct,total_interactions,summary_text,highlights) values(%s,%s,%s,%s,%s,%s,%s,%s::jsonb) on conflict(elder_id,summary_date) do update set mood_score=excluded.mood_score,mood_label=excluded.mood_label,medicine_compliance_pct=excluded.medicine_compliance_pct,total_interactions=excluded.total_interactions,summary_text=excluded.summary_text,highlights=excluded.highlights returning *", (str(elder_id), summary_date, summary["mood_score"], summary["mood_label"], summary["medicine_compliance_pct"], summary["total_interactions"], summary["summary_text"], json.dumps(summary["highlights"])))
                result = cursor.fetchone()
                return {name: value for name, value in zip([column.name for column in cursor.description], result)}
    return await _run_db(request, summarize)
