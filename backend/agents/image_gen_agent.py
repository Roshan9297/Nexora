import urllib.parse
from typing import Dict, Any, Optional

class ImageGenAgent:
    """
    100% Free Image Generation Agent powered by Pollinations.ai (Flux, SDXL, Turbo).
    Zero API key required, zero subscription, instant generation.
    """

    STYLES = {
        "photorealistic": "hyperrealistic, 8k resolution, cinematic lighting, ultra-detailed, photorealistic, professional photography",
        "anime": "anime aesthetic, Makoto Shinkai style, vibrant colors, detailed line art, masterpiece",
        "cyberpunk": "cyberpunk style, neon lights, futuristic city, volumetric glow, high tech, dark rainy atmosphere",
        "3d_render": "3D render, Unreal Engine 5, Octane render, smooth textures, ray tracing, Disney Pixar style",
        "oil_painting": "classic oil painting, visible textured brushstrokes, artistic masterpiece, rich colors",
        "minimalist": "minimalist vector art, clean lines, flat design, elegant modern composition",
        "cinematic": "cinematic movie still, 35mm film grain, dramatic lighting, anamorphic lens, epic scene"
    }

    @staticmethod
    def generate_image_url(
        prompt: str,
        style: Optional[str] = None,
        aspect_ratio: str = "1:1",
        model: str = "flux",
        seed: Optional[int] = None
    ) -> Dict[str, Any]:
        dimensions = {
            "1:1": (1024, 1024),
            "16:9": (1280, 720),
            "9:16": (720, 1280),
            "4:3": (1024, 768),
            "3:2": (1080, 720)
        }

        width, height = dimensions.get(aspect_ratio, (1024, 1024))

        full_prompt = prompt.strip()
        if style and style in ImageGenAgent.STYLES:
            full_prompt = f"{full_prompt}, {ImageGenAgent.STYLES[style]}"

        encoded_prompt = urllib.parse.quote(full_prompt)
        
        params = [
            f"width={width}",
            f"height={height}",
            f"model={model or 'flux'}",
            "nologo=true",
            "enhance=true"
        ]
        if seed is not None:
            params.append(f"seed={seed}")

        url = f"https://image.pollinations.ai/prompt/{encoded_prompt}?{'&'.join(params)}"

        return {
            "prompt": prompt,
            "style": style or "natural",
            "aspect_ratio": aspect_ratio,
            "width": width,
            "height": height,
            "image_url": url,
            "model": model or "flux"
        }
