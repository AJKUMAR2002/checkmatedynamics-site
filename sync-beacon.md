# Check whether your cameras agree on time.

Source: https://checkmatedynamics.com/sync-beacon.html

[Stations](https://checkmatedynamics.com/stations.html) / C — Sync / C1 | Timing test instrument · Patent pending

The cameras in a robot recording rarely share a clock. Host timestamps are late and noisy, frames drop or repeat, and a camera’s labeled frame rate is often not its real one. The Sync Beacon is an LED clock that steps every 1 ms. Film it with every camera, and the decoder reports each camera’s true frame rate, dropped and repeated frames, host-timestamp latency and the offset between cameras. There is no trigger cable and no change to the camera. It measures; it does not trigger cameras.

**14-day rental** | A beacon ships to you, per station | **$999**

**Own one** | A founding Sync Beacon, yours | **$1,250**

[Book a timing check](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20timing%20check&body=Cameras%20and%20frame%20rates%3A%0ARobot%20and%20recorder%3A%0ALocation%3A) | See the offers

A timing test instrument for rig validation and QA. Sold to labs and companies. Guides: [check sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html), [measure latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html), [sync cameras and joints](https://checkmatedynamics.com/sync-cameras-and-joints.html).

**Fig. 01** Sync Beacon, exterior Wireframe from CAD

**01** The problem

## Every stream on your rig keeps its own time.

Each camera, joint log and depth stream stamps its data on a different clock. When they disagree, the dataset pairs images with the wrong joint readings.

01

### Cameras stamp late

A USB camera’s timestamp is usually when the host received the frame, not when the sensor exposed it. Buffers and USB scheduling put an unknown delay between the two.

02

### Clocks start apart and drift

Joint encoders log on the controller’s clock. Cameras log on the PC’s. They start at different moments and move apart over a session.

03

### Most rigs never measure it

Without a shared reference, skew shows up as a policy that almost works and an episode that gets rejected with no stated cause. Most rigs carry no number for it.

**—** Same moment

Beacon clock

Camera A

Camera B

Wrist camera

Joint log

**Fig. 02** One instant, four clocks. The dashed line marks the same moment Diagram

**frame_index / fps**

How LeRobot computes each recorded frame’s timestamp: from the frame counter, not from the camera. It records when the recorder counted the frame, not when the camera captured it.

[LeRobot source, dataset_writer.py line 225](https://github.com/huggingface/lerobot/blob/626da71be9d21b3c740b6438514519a503a2d535/src/lerobot/datasets/dataset_writer.py#L225), read Oct 28, 2026

**02** The beacon

## A clock your cameras can film.

The beacon sits in view of your cameras and shows an LED clock that steps every 1 ms. Every camera films it. The decoder reads the clock in each frame, so every frame’s exposure time lands on one clock.

You get dropped frames, repeated frames, true frame intervals, host-timestamp latency and the offset between cameras, per camera. It works with cameras that can see the face, and your Station Report confirms it on your cameras. Nothing is wired to the cameras, and nothing changes in your recorder.

**Fig. 03** The LED face: 8 × 8, stepping every 1 ms Diagram

**1 ms**

LED clock step. Selectable at 0.5 ms and 2 ms.

**8 × 8**

Green LED face, 525 nm. Green light passes the IR-cut filter on camera sensors.

**Camera-agnostic**

Built for webcams, machine-vision cameras and phones that can see the face. Your Station Report confirms each camera on your rig.

**03** Station Report

## Proof, not a feeling.

The Station Report lists, for each camera, how many frames were placed on the beacon clock, what was dropped or repeated, the true frame interval, and the offset to every other camera.

Keep it with the dataset. When a data buyer or a reviewer asks how well aligned the streams are, you have the measurement.

On a 120 fps global-shutter camera it decoded 7,241 of 7,241 frames, and frame times repeat to 37 µs. That is repeatability on our bench, not a certified accuracy figure. Accuracy on your cameras is measured for your rig in the Station Report.

**Station Report** session 03 · station B-04

Camera A, frames on beacon clock | 1,799 / 1,800

Camera A, dropped · repeated | 1 · 0

Camera B, true frame interval | 33.4 ms

Camera B, offset to camera A | +6.2 ms

Wrist camera, offset to camera A | −11.8 ms

Shutter type · line time | rolling · 18 µs

Station Report

**04** How it works

## Place it, record a minute, read the report.

01

### Place it in view

Set the beacon where every camera can see its face, on a tripod or clamp. The Station Report confirms the placement for each camera. Power from any USB port.

02

### Record a test session

Set a short manual exposure and lock focus on the face. Record every camera over the same 60 s.

03

### Decode and read

Run the decoder on each video on your PC. Every frame lands on the beacon clock, and the Station Report shows drops, repeats, intervals and camera-to-camera offset.

**05** Who it’s for

## Teams that need to know their rig is aligned.

Use it to check a rig before you record on it and again whenever the rig changes.

A

### Data-collection teams

Validate each new station before it records. Re-check after a camera swap, a USB change or a rebuild. Hand your buyer a measurement of the timing, not a promise.

B

### University labs

Know your cameras and arms line up before a study’s data collection starts, and put the figures in the methods. Invoiced by P-card, PO, card or ACH.

C

### Rig builders and integrators

Commission a station, find the camera that runs late and confirm the fix, with the same instrument on every rig you build.

**06** Offers

## Check one station, or keep a beacon.

Rent one for 14 days, or own one from the start.

Rental

### 14-day rental

A beacon ships to your lab. A 60-minute setup call, a Station Report for one station, a closing call to go through it, and shipping both ways. US only. Keep that beacon within 30 days of the rental starting and $500 of the rental counts toward it.

**$999** | per station, 14 days | [Reserve a rental](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%2014-day%20rental&body=Cameras%20and%20frame%20rates%3A%0APreferred%20dates%3A)

Subscription

### Remote timing check

A beacon stays at your lab on loan. A setup call, a monthly timing check we decode with you, checks on demand after a camera swap or a rebuild, and a replacement if the unit fails.

**$149 / mo** | $750 setup, 6-month minimum | [Start a subscription](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20subscription&body=Cameras%20and%20frame%20rates%3A%0ALocation%3A)

Own

### Own one

A founding Sync Beacon, numbered on its calibration certificate. With a tripod adapter, a USB-C cable, the decoder and a quickstart. Includes a free Station Report call, 12 months of warranty and a 30-day return. At $1,250 it fits a university P-card.

**$1,250** | per beacon | [Ask to buy one](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20purchase&body=Cameras%20and%20frame%20rates%3A%0AShip%20to%3A)

Prices in US dollars. Ships within 2 weeks of your order. Invoiced by card, ACH, P-card or purchase order. Shipped offers are US only. Sold and rented to labs and companies as test equipment, for timing measurement, rig validation and QA. Patent pending.

**07** At a glance

## What it is, in numbers.

| LED clock | 1 ms step, with 0.5 ms and 2 ms selectable |
|---|---|
| LED face | 8 × 8 green LEDs, 525 nm |
| Cameras | Works with cameras that can see the face; confirmed per camera in the Station Report. No wiring to the camera. It measures; it does not trigger |
| Reference pulses | Two SYNC outputs, 100 µs active-low pulses, 30 Hz by default |
| Clock stability | ±0.14 ppm over 3 h on the first unit measured (bench result, Oct 26, 2026). Each unit ships with its own calibration certificate |
| Power | USB-C, 5 V. No radio, no network |
| Mounting | 1/4”-20 tripod adapter |
| Decoder | Runs on your PC in Python 3 with numpy and OpenCV |

**08** Questions

## Camera timing questions, answered.

**How do I check that my cameras are in sync without a hardware trigger?**

Film one LED clock with every camera and decode each recording. Every frame lands on the clock’s time, so you read each camera’s offset to the others, its dropped and repeated frames and its true frame interval. Nothing is wired to the cameras.

**How do I measure camera latency per frame?**

The clock’s reading in a frame is when the sensor saw it. Compare that with the host’s timestamp for the same frame and the difference is the capture-to-host latency. On our bench one USB camera showed a median of 2.95 ms and a 99th percentile of 9.32 ms (one camera, one PC, Nov 3, 2026).

**Is my 120 fps camera really 120 fps?**

The decoder reports the true frame rate from the clock, not from the label. The 120 fps camera on our bench ran at 120.625 fps, so trusting the label would misplace frames by about 313 ms after one minute.

**How do I detect dropped or repeated frames in a multi-camera recording?**

The decoder lists every dropped and repeated frame per camera and when it happened. A 2.4 second USB stall (292 frames) on our bench was found and placed exactly.

**Can I check the camera timestamps in a LeRobot dataset?**

LeRobot stamps each frame as frame_index divided by fps, so the stored timestamps cannot show camera skew. Film the beacon with the same cameras, decode the videos and compare. In a synthetic test the decoder read LeRobot’s default AV1, MJPEG and H.264 at crf 23, and did not read H.265.

**Does the beacon trigger or synchronize my cameras?**

No. It measures; it does not trigger cameras, and nothing changes on your cameras or in your recorder. If you already trigger your cameras, it shows what the trigger achieved.

**Can it line up my robot joints with the camera frames?**

It measures the camera half: each camera’s latency and jitter against true time. Camera-to-robot-action timing on your rig is not available yet, because it needs the robot’s clock tied to the beacon.

**How accurate is it?**

On a 120 fps global-shutter camera it decoded 7,241 of 7,241 frames, and frame times repeat to 37 µs. That is repeatability on our bench, not a certified accuracy figure, and we have not yet measured it against an independent reference.

**Where do I put it, and can a wrist camera see it?**

Put it where every camera can see its face. In a synthetic test at 640 x 480 the decoder worked within 0.6 m and 45 degrees of the lens axis, and at 720p within 2.1 m facing the camera. A wrist camera sees it only when the arm points at it, so the check is something you run, not something left in every episode.

**How much does it cost?**

A 14-day rental is $999 per station and owning one is $1,250. Both are sold to labs and companies as test equipment.

Related: [Stations](https://checkmatedynamics.com/stations.html) · [Sync cameras and joints](https://checkmatedynamics.com/sync-cameras-and-joints.html) · [Check multi-camera sync in a recording](https://checkmatedynamics.com/check-multi-camera-sync-in-a-recording.html) · [Measure camera latency per frame](https://checkmatedynamics.com/measure-camera-latency-per-frame.html) · [Contour](https://checkmatedynamics.com/contour.html)

## Find out how far apart your streams really are.

Send us your cameras and frame rates. We reply with the quickest way to measure your rig.

[Book a timing check](mailto:contact@checkmatedynamics.com?subject=Sync%20Beacon%20timing%20check&body=Cameras%20and%20frame%20rates%3A%0ARobot%20and%20recorder%3A%0ALocation%3A) | See the offers
