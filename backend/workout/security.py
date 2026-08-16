import time
from functools import wraps
from django.core.cache import cache
from django.http import JsonResponse


def get_client_ip(request):
    """Safely extract client IP from headers, prioritizing X-Forwarded-For if available."""
    x_forwarded_for = request.META.get("HTTP_X_FORWARDED_FOR")
    if x_forwarded_for:
        ip = x_forwarded_for.split(",")[0].strip()
    else:
        ip = request.META.get("REMOTE_ADDR", "127.0.0.1")
    return ip


def rate_limit(key_prefix: str, limit: int = 5, window_seconds: int = 60):
    """
    Rate limiting decorator using Django cache.
    Limits requests to `limit` within `window_seconds`.
    """
    def decorator(view_func):
        @wraps(view_func)
        def wrapper(request, *args, **kwargs):
            ip = get_client_ip(request)
            cache_key = f"rl:{key_prefix}:{ip}"
            
            # Sliding / fixed window bucket in cache
            current_time = int(time.time())
            request_history = cache.get(cache_key, [])
            
            # Filter timestamps within window
            valid_history = [t for t in request_history if current_time - t < window_seconds]
            
            if len(valid_history) >= limit:
                retry_after = window_seconds - (current_time - valid_history[0]) if valid_history else window_seconds
                response = JsonResponse(
                    {
                        "error": "Too many requests. Please slow down and try again later.",
                        "retry_after": max(1, retry_after),
                    },
                    status=429,
                )
                response["Retry-After"] = str(max(1, retry_after))
                return response

            valid_history.append(current_time)
            cache.set(cache_key, valid_history, timeout=window_seconds + 5)
            
            return view_func(request, *args, **kwargs)

        return wrapper

    return decorator


class SecurityHeadersMiddleware:
    """Middleware that injects production-grade HTTP security headers on all responses."""

    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        response = self.get_response(request)

        # Content Security Policy (allows local app + trusted CDNs for React/fonts/styles)
        csp_directives = [
            "default-src 'self'",
            "script-src 'self' 'unsafe-inline' https://esm.sh https://cdnjs.cloudflare.com",
            "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
            "font-src 'self' https://fonts.gstatic.com",
            "img-src 'self' data: https:",
            "connect-src 'self' https://esm.sh",
            "frame-ancestors 'none'",
            "base-uri 'self'",
            "form-action 'self'",
        ]
        response["Content-Security-Policy"] = "; ".join(csp_directives)

        # Defense-in-depth headers
        response["X-Content-Type-Options"] = "nosniff"
        response["X-Frame-Options"] = "DENY"
        response["Referrer-Policy"] = "strict-origin-when-cross-origin"
        response["Permissions-Policy"] = "camera=(), microphone=(), geolocation=(), payment=()"
        response["Cross-Origin-Opener-Policy"] = "same-origin"

        return response
