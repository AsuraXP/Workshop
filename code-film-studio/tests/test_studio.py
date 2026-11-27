import unittest, tempfile, json, math
from pathlib import Path
from studio.motion import track, sample, local, push
from studio.render import validate, svg_frame, load_spec
from studio.rig import rig, hand_position
from studio.export import timestamp, srt
from studio.audio import tone, noise, score

class Motion(unittest.TestCase):
    def test_shot_local(self):
        k=local([[10,0],[12,1]],10,2); self.assertEqual(sample(k,0),0); self.assertEqual(sample(k,1),.5); self.assertEqual(sample(k,2),1)
    def test_out_of_shot_rejected(self):
        with self.assertRaises(ValueError): local([[9,0]],10,2)
    def test_duplicate_keys(self):
        with self.assertRaises(ValueError): track([[0,1],[0,2]])
    def test_camera_center(self):
        c=push(700,300,1,2,2); self.assertEqual(sample(c,0)["cx"],700); self.assertEqual(sample(c,2)["zoom"],2)
    def test_hold(self):
        self.assertEqual(sample(track([[0,5],[2,5]]),1),5)

class RigTests(unittest.TestCase):
    def test_deterministic(self):
        c={"costume":{}}; p={"x":100,"y":200,"scale":1}
        self.assertEqual(rig(c,p,1),rig(c,p,1))
    def test_hand_matches_pose(self):
        p={"x":100,"y":200,"scale":1,"arm_r":90}; x,y=hand_position(p)
        self.assertAlmostEqual(x,186); self.assertAlmostEqual(y,152)
    def test_blink_changes_svg(self):
        a=rig({}, {"blink":1}); b=rig({}, {"blink":0})
        self.assertNotEqual(a,b)

class RenderTests(unittest.TestCase):
    def spec(self):
        return dict(width=320,height=180,fps=24,shots=[dict(id="a",duration=1,elements=[dict(type="rect",x=0,y=0,w=10,h=10,fill="#fff")],camera=push(160,90,1,1.1,1))])
    def test_valid_xml(self):
        import xml.etree.ElementTree as ET
        ET.fromstring(svg_frame(self.spec(),self.spec()["shots"][0],.5))
    def test_duplicate_id(self):
        s=self.spec(); s["shots"].append(s["shots"][0])
        with self.assertRaises(AssertionError): validate(s)
    def test_line_no_duplicate_attrs(self):
        s=self.spec(); s["shots"][0]["elements"]=[dict(type="line",x1=0,y1=0,x2=10,y2=10,stroke="#fff",stroke_width=3)]
        import xml.etree.ElementTree as ET; ET.fromstring(svg_frame(s,s["shots"][0],0))

class ExportTests(unittest.TestCase):
    def test_timestamp(self): self.assertEqual(timestamp(61.5),"00:01:01,500")
    def test_srt_offsets(self):
        s=dict(shots=[dict(id="a",duration=2,subtitle="one"),dict(id="b",duration=2,subtitle="two")])
        with tempfile.TemporaryDirectory() as d:
            p=Path(d)/"x.srt"; srt(s,p); text=p.read_text(); self.assertIn("00:00:02,300",text)

class AudioTests(unittest.TestCase):
    def test_lengths(self):
        self.assertEqual(len(tone(440,1)),48000); self.assertEqual(len(noise(1,"rain")),48000)
    def test_score_finite(self):
        x=score(3); self.assertTrue(math.isfinite(float(x.max()))); self.assertLessEqual(float(abs(x).max()),1)

if __name__=="__main__": unittest.main()
