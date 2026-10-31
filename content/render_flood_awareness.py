"""Render an illustrative, caption-led 9:16 Palm92 Community Pulse short.

Requirements: Python 3, Pillow, and FFmpeg on PATH. The scenes are original
vector illustrations, not documentary footage or depictions of a real place.
"""
from pathlib import Path
import subprocess
import tempfile

from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1920
FPS = 30
DURATION = 5
ROOT = Path(__file__).resolve().parent
OUTPUT = ROOT / "palm92-community-pulse-flood.mp4"
FONT_REG = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONT_BOLD = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"
FONT_MONO = "/usr/share/fonts/truetype/dejavu/DejaVuSansMono.ttf"
GREEN = (18, 53, 43)
LIME = (219, 243, 106)
CREAM = (248, 247, 231)
MINT = (125, 183, 135)
BLUE = (93, 168, 196)
INK = (25, 48, 42)


def font(size, bold=False, mono=False):
    path = FONT_MONO if mono else FONT_BOLD if bold else FONT_REG
    return ImageFont.truetype(path, size)


def rounded(draw, box, radius, fill, outline=None, width=1):
    draw.rounded_rectangle(box, radius=radius, fill=fill, outline=outline, width=width)


def wrapped(draw, text, fnt, max_width):
    words = text.split()
    lines, current = [], ""
    for word in words:
        candidate = f"{current} {word}".strip()
        if draw.textbbox((0, 0), candidate, font=fnt)[2] <= max_width:
            current = candidate
        else:
            if current:
                lines.append(current)
            current = word
    if current:
        lines.append(current)
    return lines


def text_block(draw, xy, text, fnt, fill, max_width, spacing=15):
    x, y = xy
    for line in wrapped(draw, text, fnt, max_width):
        draw.text((x, y), line, font=fnt, fill=fill)
        y += fnt.size + spacing


def base(scene_no, kicker, caption):
    im = Image.new("RGB", (W, H), GREEN)
    d = ImageDraw.Draw(im)
    # Soft, illustrated spotlight and horizon bands.
    for radius, color in [(470, (23, 72, 57)), (365, (28, 83, 64)), (240, (35, 96, 70))]:
        d.ellipse((W//2-radius, 275-radius, W//2+radius, 275+radius), fill=color)
    d.text((78, 88), "PALM92  /  COMMUNITY PULSE", font=font(25, True, True), fill=LIME)
    d.text((82, 142), kicker.upper(), font=font(19, False, True), fill=(185, 212, 192))
    rounded(d, (66, 1378, 1014, 1820), 35, CREAM)
    d.text((104, 1420), f"0{scene_no}  /  06", font=font(18, True, True), fill=(83, 121, 97))
    text_block(d, (104, 1480), caption, font(50, True), INK, 870, 17)
    d.text((104, 1767), "A PROPOSED COMMUNITY PILOT · ILLUSTRATIVE SCENES", font=font(15, True, True), fill=(91, 120, 101))
    return im, d


def rain_scene():
    im, d = base(1, "A local signal", "A blocked drain can look like a small problem...")
    # Cloud, rain, homes, pavement and a street drain.
    d.ellipse((215, 285, 490, 490), fill=(202, 222, 211))
    d.ellipse((370, 260, 630, 495), fill=(215, 232, 219))
    d.ellipse((510, 305, 785, 500), fill=(194, 218, 207))
    for x in [275, 365, 490, 610, 715]:
        d.line((x, 505, x-32, 580), fill=BLUE, width=10)
    # Simple homes
    for x, y, scale, roof in [(75, 800, 1, (229, 143, 88)), (695, 730, 1.1, (205, 117, 81))]:
        width, height = int(255*scale), int(220*scale)
        d.rectangle((x, y, x+width, y+height), fill=(239, 232, 198))
        d.polygon([(x-25, y+10), (x+width//2, y-140), (x+width+25, y+10)], fill=roof)
        d.rectangle((x+width//2-25, y+height-88, x+width//2+25, y+height), fill=(80, 119, 100))
    # road and rainwater
    d.rectangle((0, 1035, W, 1330), fill=(50, 82, 75))
    d.polygon([(0, 1205), (1080, 1110), (1080, 1335), (0, 1335)], fill=(64, 119, 132))
    for x in [95, 265, 790, 940]:
        d.line((x, 1190, x+85, 1183), fill=(186, 219, 198), width=7)
    rounded(d, (406, 1174, 559, 1233), 12, (31, 51, 45))
    for i in range(5):
        d.line((425+i*25, 1183, 425+i*25, 1222), fill=(161, 180, 159), width=4)
    d.ellipse((486, 1110, 542, 1166), fill=LIME)
    d.text((500, 1116), "!", font=font(35, True), fill=INK)
    return im


def report_scene():
    im, d = base(2, "A resident reports", "...until heavy rain turns the road into a river.")
    # Phone card
    rounded(d, (215, 340, 865, 1265), 60, (244, 246, 229), outline=(217, 243, 106), width=6)
    rounded(d, (420, 365, 660, 392), 14, (38, 61, 53))
    d.text((275, 460), "COMMUNITY REPORT", font=font(19, True, True), fill=(78, 122, 93))
    d.text((275, 510), "Flood & drains", font=font(36, True), fill=INK)
    rounded(d, (270, 590, 810, 810), 22, (75, 131, 140))
    d.polygon([(270, 745), (440, 675), (540, 738), (660, 648), (810, 716), (810, 810), (270, 810)], fill=(45, 94, 86))
    rounded(d, (452, 672, 546, 715), 8, (30, 45, 40))
    d.ellipse((488, 625, 530, 667), fill=LIME)
    d.text((493, 630), "!", font=font(28, True), fill=INK)
    d.text((275, 870), "Area or landmark", font=font(18, True), fill=(102, 119, 106))
    rounded(d, (270, 908, 810, 972), 14, (255, 255, 249), outline=(216, 225, 212), width=2)
    d.text((294, 927), "Near the community centre", font=font(19), fill=(59, 79, 68))
    d.text((275, 1010), "What did you notice?", font=font(18, True), fill=(102, 119, 106))
    d.text((294, 1051), "Standing water beside a blocked drain", font=font(18), fill=INK)
    rounded(d, (270, 1148, 810, 1210), 18, GREEN)
    d.text((407, 1165), "ADD REPORT   ↗", font=font(20, True, True), fill=LIME)
    return im


def map_scene():
    im, d = base(3, "Organise the pattern", "Residents share what they observe.")
    # Abstract map and clustered points
    rounded(d, (80, 340, 1000, 1285), 38, (233, 236, 211))
    for x in range(125, 1000, 175):
        d.line((x, 365, x+170, 1260), fill=(198, 215, 194), width=9)
    for y in range(400, 1260, 175):
        d.line((100, y, 990, y-55), fill=(206, 220, 199), width=8)
    d.line([(120, 1130), (310, 1030), (470, 1080), (630, 920), (920, 890)], fill=(100, 158, 165), width=20)
    d.line([(115, 600), (330, 650), (490, 560), (740, 630), (960, 530)], fill=(211, 160, 108), width=14)
    for x, y in [(320, 823), (365, 790), (408, 839), (439, 794), (708, 1025), (760, 982)]:
        d.ellipse((x-31, y-31, x+31, y+31), fill=(213, 145, 76), outline=(255, 255, 247), width=7)
        d.ellipse((x-7, y-7, x+7, y+7), fill=(255, 251, 231))
    rounded(d, (233, 470, 796, 585), 23, GREEN)
    d.text((273, 490), "3 reports · one possible hotspot", font=font(23, True), fill=CREAM)
    d.text((274, 537), "PATTERN TO CHECK · NOT A VERIFIED ALERT", font=font(13, True, True), fill=LIME)
    return im


def assistant_scene():
    im, d = base(4, "Explain the limits", "AI could group reports and flag possible hotspots.")
    # Human review desk / tablet
    rounded(d, (125, 495, 955, 1190), 44, (223, 234, 218))
    rounded(d, (200, 585, 880, 1068), 28, (35, 70, 56))
    d.text((250, 640), "REVIEW BEFORE ACTION", font=font(21, True, True), fill=LIME)
    d.text((250, 720), "What is observed", font=font(27, True), fill=CREAM)
    d.text((250, 766), "• 3 reports near one drain", font=font(22), fill=(219, 236, 222))
    d.text((250, 817), "• received within 20 minutes", font=font(22), fill=(219, 236, 222))
    d.line((250, 877, 825, 877), fill=(95, 132, 107), width=3)
    d.text((250, 907), "What is not known", font=font(24, True), fill=(246, 196, 129))
    d.text((250, 950), "• drain condition not yet checked", font=font(19), fill=(235, 218, 189))
    # Person silhouette beside dashboard
    d.ellipse((410, 333, 560, 483), fill=(202, 144, 102))
    d.rounded_rectangle((355, 470, 615, 630), radius=73, fill=(135, 183, 133))
    d.polygon([(325, 1125), (755, 1125), (910, 1264), (185, 1264)], fill=(203, 216, 196))
    d.text((317, 1280), "A person verifies the report and decides what to do.", font=font(22, True), fill=CREAM)
    return im


def response_scene():
    im, d = base(5, "People respond", "A person checks the evidence and decides what happens next.")
    # Worker clearing a drain, illustrative and non-identifiable
    d.rectangle((0, 1050, W, 1340), fill=(51, 98, 84))
    d.polygon([(0, 1210), (1080, 1125), (1080, 1340), (0, 1340)], fill=(70, 135, 147))
    rounded(d, (710, 510, 960, 805), 35, (228, 231, 211))
    d.rectangle((740, 600, 930, 795), fill=(87, 130, 103))
    d.polygon([(708, 606), (835, 485), (963, 606)], fill=(210, 129, 83))
    d.rounded_rectangle((775, 663, 898, 694), radius=8, fill=(221, 243, 107))
    d.text((784, 667), "CHECKED", font=font(14, True, True), fill=INK)
    # responder body
    d.ellipse((300, 670, 405, 775), fill=(191, 130, 91))
    d.rounded_rectangle((270, 764, 435, 1045), radius=55, fill=(222, 187, 63))
    d.polygon([(292, 1017), (365, 1017), (341, 1238), (270, 1238)], fill=(39, 63, 54))
    d.polygon([(367, 1017), (421, 1017), (470, 1225), (403, 1238)], fill=(39, 63, 54))
    d.line((280, 810, 188, 946), fill=(191, 130, 91), width=34)
    d.line((418, 820, 505, 950), fill=(191, 130, 91), width=34)
    # drain and tool
    rounded(d, (95, 1140, 250, 1205), 12, (29, 47, 41))
    for x in range(111, 245, 28):
        d.line((x, 1150, x, 1197), fill=(155, 177, 148), width=4)
    d.line((491, 915, 585, 1130), fill=(226, 234, 207), width=13)
    d.text((284, 1295), "AI helps organise. Local teams take action.", font=font(25, True), fill=CREAM)
    return im


def closing_scene():
    im, d = base(6, "Palm92 Community Pulse", "AI can help organise a warning. People still need to act.")
    d.ellipse((310, 360, 770, 820), fill=(217, 243, 106))
    d.text((407, 490), "P", font=font(245, True), fill=GREEN)
    d.text((145, 905), "COULD YOUR COMMUNITY", font=font(31, True, True), fill=(198, 223, 196))
    d.text((145, 970), "PREPARE SOONER?", font=font(62, True), fill=CREAM)
    rounded(d, (145, 1080, 775, 1160), 24, (38, 88, 67))
    d.text((190, 1101), "PROPOSED PILOT · LONDON / NIGERIA", font=font(20, True, True), fill=LIME)
    d.text((146, 1230), "Community reports  →  Human review  →  Local response", font=font(18, True), fill=CREAM)
    return im


def main():
    scenes = [rain_scene(), report_scene(), map_scene(), assistant_scene(), response_scene(), closing_scene()]
    with tempfile.TemporaryDirectory(prefix="palm92-flood-video-") as temp:
        folder = Path(temp)
        for index, image in enumerate(scenes, 1):
            image.save(folder / f"scene-{index:02d}.png", optimize=True)
        inputs = []
        filters = []
        for i in range(len(scenes)):
            inputs.extend(["-loop", "1", "-framerate", str(FPS), "-t", str(DURATION), "-i", str(folder / f"scene-{i+1:02d}.png")])
            filters.append(f"[{i}:v]scale=1120:1980,crop=1080:1920,zoompan=z='1+0.025*on/{FPS*DURATION}':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s={W}x{H}:fps={FPS},fade=t=in:st=0:d=0.3,fade=t=out:st={DURATION-0.3}:d=0.3,setsar=1[v{i}]")
        labels = "".join(f"[v{i}]" for i in range(len(scenes)))
        filters.append(f"{labels}concat=n={len(scenes)}:v=1:a=0[outv]")
        cmd = ["ffmpeg", "-y", *inputs, "-filter_complex", ";".join(filters), "-map", "[outv]", "-an", "-c:v", "libx264", "-preset", "medium", "-crf", "22", "-pix_fmt", "yuv420p", "-movflags", "+faststart", str(OUTPUT)]
        subprocess.run(cmd, check=True, stdout=subprocess.DEVNULL, stderr=subprocess.PIPE)
    print(f"Rendered {OUTPUT} ({OUTPUT.stat().st_size:,} bytes)")


if __name__ == "__main__":
    main()
