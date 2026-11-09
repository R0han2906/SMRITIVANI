# Gnani integration status

Gnani is intended to provide primary Indian-language ASR/TTS/NLU services. The current adapter reads configuration fields but intentionally does not send requests. The project does not include verified Gnani endpoint paths, authorization headers, payload schemas, or response schemas.

Before enabling production Gnani calls:

1. Obtain the current Gnani API documentation from the project/challenge account.
2. Verify ASR, TTS, NLU, sentiment, keyword, translation, and biometric APIs individually.
3. Implement each neutral provider method using the documented authentication, request, timeout, and response contracts.
4. Confirm Hindi and configured elder-language behavior and error fallback with the user.
5. Add secrets only to the server's private `.env`; never add them to this repository or frontend env.

`GNANI_*` variables are listed in `backend/.env.example`. Supplying a key alone does not enable requests; the adapter stays disabled until the actual contract is implemented.

