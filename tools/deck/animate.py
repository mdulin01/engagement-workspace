"""Add fade transitions to every slide and click-step animations to the endpoint slides."""
import re, sys, glob, os

root = sys.argv[1]  # unpacked deck dir


class Ids:
    def __init__(self):
        self.n = 0

    def __call__(self):
        self.n += 1
        return self.n


def shape_map(xml):
    return {name: sid for sid, name in re.findall(r'<p:cNvPr id="(\d+)" name="([^"]*)"', xml)}


def effect(ids, spid, kind, node_type, dur):
    """kind: 'in' or 'out' (fade)."""
    cls = "entr" if kind == "in" else "exit"
    grp = "0" if kind == "in" else "1"
    a, b, c = ids(), ids(), ids()
    vis_set = (
        f'<p:set><p:cBhvr><p:cTn id="{b}" dur="1" fill="hold"><p:stCondLst><p:cond delay="{0 if kind == "in" else dur - 1}"/></p:stCondLst></p:cTn>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl><p:attrNameLst><p:attrName>style.visibility</p:attrName></p:attrNameLst></p:cBhvr>'
        f'<p:to><p:strVal val="{"visible" if kind == "in" else "hidden"}"/></p:to></p:set>'
    )
    anim = (
        f'<p:animEffect transition="{kind}" filter="fade"><p:cBhvr><p:cTn id="{c}" dur="{dur}"/>'
        f'<p:tgtEl><p:spTgt spid="{spid}"/></p:tgtEl></p:cBhvr></p:animEffect>'
    )
    body = vis_set + anim if kind == "in" else anim + vis_set
    return (
        f'<p:par><p:cTn id="{a}" presetID="10" presetClass="{cls}" presetSubtype="0" fill="hold" grpId="{grp}" nodeType="{node_type}">'
        f'<p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>{body}</p:childTnLst></p:cTn></p:par>'
    )


def click_step(ids, effects_xml):
    outer, inner = ids(), ids()
    return (
        f'<p:par><p:cTn id="{outer}" fill="hold"><p:stCondLst><p:cond delay="indefinite"/></p:stCondLst><p:childTnLst>'
        f'<p:par><p:cTn id="{inner}" fill="hold"><p:stCondLst><p:cond delay="0"/></p:stCondLst><p:childTnLst>'
        f'{effects_xml}</p:childTnLst></p:cTn></p:par></p:childTnLst></p:cTn></p:par>'
    )


def timing(steps, dur):
    """steps: list of lists of (spid, kind). First effect of each step is the click effect."""
    ids = Ids()
    root_id, seq_id = ids(), ids()
    step_xml = []
    builds = set()
    for step in steps:
        effs = []
        for i, (spid, kind) in enumerate(step):
            effs.append(effect(ids, spid, kind, "clickEffect" if i == 0 else "withEffect", dur))
            builds.add((spid, "0" if kind == "in" else "1"))
        step_xml.append(click_step(ids, "".join(effs)))
    bld = "".join(f'<p:bldP spid="{s}" grpId="{g}" animBg="1"/>' for s, g in sorted(builds, key=lambda t: (int(t[0]), t[1])))
    return (
        f'<p:timing><p:tnLst><p:par><p:cTn id="{root_id}" dur="indefinite" restart="never" nodeType="tmRoot"><p:childTnLst>'
        f'<p:seq concurrent="1" nextAc="seek"><p:cTn id="{seq_id}" dur="indefinite" nodeType="mainSeq"><p:childTnLst>'
        + "".join(step_xml)
        + '</p:childTnLst></p:cTn><p:prevCondLst><p:cond evt="onPrev" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:prevCondLst>'
        '<p:nextCondLst><p:cond evt="onNext" delay="0"><p:tgtEl><p:sldTgt/></p:tgtEl></p:cond></p:nextCondLst></p:seq>'
        f'</p:childTnLst></p:cTn></p:par></p:tnLst><p:bldLst>{bld}</p:bldLst></p:timing>'
    )


def ids_with_prefix(smap, prefix):
    return [sid for name, sid in sorted(smap.items(), key=lambda kv: int(kv[1])) if name.startswith(prefix)]


TRANSITION = '<p:transition spd="med"><p:fade/></p:transition>'

for path in sorted(glob.glob(os.path.join(root, "ppt/slides/slide*.xml")), key=lambda p: int(re.findall(r"(\d+)\.xml", p)[0])):
    n = int(re.findall(r"(\d+)\.xml", path)[0])
    xml = open(path, encoding="utf-8").read()
    assert "<p:timing" not in xml and "<p:transition" not in xml
    smap = shape_map(xml)
    extra = TRANSITION
    has = lambda pre: any(k.startswith(pre) for k in smap)
    if has("L1_") and not has("H1_"):  # build the endpoint layer by layer
        steps = [[(s, "in") for s in ids_with_prefix(smap, p)] for p in ["L1_", "L2_", "L3_", "L4_", "L5_"]]
        assert all(steps), "missing layer shapes"
        extra += timing(steps, 500)
    if has("H1_"):  # walk through: highlight one part at a time
        groups = [ids_with_prefix(smap, f"H{i}_") for i in range(1, 6)]
        assert all(len(g) == 3 for g in groups), groups
        steps = [[(s, "in") for s in groups[0]]]
        for i in range(1, 5):
            steps.append([(s, "out") for s in groups[i - 1]] + [(s, "in") for s in groups[i]])
        extra += timing(steps, 400)
    xml = xml.replace("</p:clrMapOvr>", "</p:clrMapOvr>" + extra, 1)
    open(path, "w", encoding="utf-8").write(xml)
    print("slide", n, "ok", "(animated)" if (has("L1_") or has("H1_")) else "")
