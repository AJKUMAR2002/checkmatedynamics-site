# Sync Kit

Source: https://checkmatedynamics.com/sync-kit.html

[Stations](https://checkmatedynamics.com/stations.html) / C — Sync / C1 | Station timing instrument · Patent pending

A Sync Beacon and Contour Wrist for each station. The beacon checks independently that every camera, joint log and depth stream agrees on time, repairs the timestamps, and writes a signed Station Report into every episode.

**Single-arm station** | Sync Beacon and Contour Wrist | **$1,490**

**Bimanual station** | Sync Beacon and two Contour Wrists | **$1,890**

**Sync Certified plan** | Per station: reports, recalibration, replacement | **$149 / mo**

[Book a call](mailto:contact@checkmatedynamics.com?subject=Data%20station%20call%3A%20Sync%20Kit) | [Request a Skew Audit](mailto:contact@checkmatedynamics.com?subject=Data%20station%20call%3A%20Skew%20Audit)

Patent pending.

This device has not been authorized as required by the rules of the Federal Communications Commission. This device is not, and may not be, offered for sale or lease, or sold or leased, until authorization is obtained.

**Fig. 01** Sync Beacon, exterior Wireframe from CAD

**Station Report** episode 000127 · station B-04

Gold

Cross-camera skew | 0.21 ± 0.08 ms | Gold

Camera to action | 0.40 ± 0.10 ms | Gold

Leader to follower | 0.05 ± 0.01 ms | Gold

Frame drops | 0 / 1,812 | Gold

Timestamp jitter, std dev | 0.32 ± 0.06 ms | Gold

Drift, session | 0.08 ms/h | Gold

Camera pose | 0.04° · 0.6 mm | Gold

Camera config | matches profile | Gold

Illustrative layout, example values. Signed and written into the episode. | Ed25519

**01** What it checks

## The station, graded independently of the recorder.

Recording software shouldn’t be the only thing grading recording software. The beacon grades each episode on its own, then reports before the scene is torn down.

01

### Re-timed, not re-recorded

True capture time for every frame goes into the dataset next to the nominal timestamp, so a skewed episode is repaired instead of discarded.

02

### Drops, per camera

Dropped and duplicated frames, frame-rate mismatches and capture-to-host latency, counted for every stream.

03

### Camera bumps

A camera that has moved since commissioning is flagged in the episode.

04

### Configuration

Catches swapped camera indices and camera settings that no longer match the station profile.

05

### Flag before reset

The operator sees FLAG or REJECT at the station while the scene is still set, and redoes the take on the spot.

06

### Station ID

Each beacon carries its station’s ID, so a row of identical stations never borrows another’s timing.

**02** Tiers

## A certificate a data buyer can check.

Gold and Pass are our target limits for teleoperation data timing. A line passes only if its measured value plus its uncertainty sits inside the limit, and every line prints both.

| Line, per episode | Gold Target | Pass Target | Reject |
|---|---|---|---|
| Cross-camera skew | 0.5 ms max | 1 ms max | > 33 ms |
| Camera to action | 1 ms max | 5 ms max | > 33 ms |
| Leader to follower | 0.1 ms max | 1 ms max | > 33 ms |
| Frame drops + duplicates | 0.05 % max | 0.1 % max | > 1 % |
| Timestamp jitter, std dev | 0.5 ms max | 2 ms max | > 10 ms |
| Drift, session | 0.1 ms/h max | 0.5 ms/h max | > 5 ms/h |
| Camera pose (docked) | 0.25° · 2.5 mm max | 0.5° · 5 mm max | Bumped mid-episode |
| Identity and config | Matches the station profile | Streams mislabeled |  |

The episode takes its worst line’s grade. Lines we can’t measure print “not measured”. Which grade a line can reach depends on the cameras at the station; Gold on USB webcams waits on our bench validation. Leader-to-follower timing is measured on Checkmate nodes.

Patent pending. U.S. provisional patent application No. 64/174,473, filed October 12, 2026, covers the Sync Beacon and the per-episode Station Report.

**03** Setup

## One cable and one plugin.

01

### Dock the beacon

Place it at the station and connect it by USB-C. No radio, no network, nothing to change on the cameras.

02

### Install the plugin

One package for your recorder, with LeRobot, ROS 2 and MCAP output.

03

### Record as usual

Every episode gets its Station Report and true capture times. Flags show at the station before the reset.

**04** In the kit

## Contour Wrist: depth at the gripper, on the same clock.

Metric contact-range geometry next to your RGB wrist camera: under 40 g (target), 30 frames per second, for indoor LED-lit stations.

[Contour Wrist](https://checkmatedynamics.com/contour.html#wrist)

Contour Wrist | **30 Hz** | depth · USB-C · sync in

**Fig. 02** Contour Wrist at a glance Specification

Related: [Stations](https://checkmatedynamics.com/stations.html) · [Contour](https://checkmatedynamics.com/contour.html) · [Hub 8 Pro](https://checkmatedynamics.com/hub-8.html) · [Checkmate Leader](https://checkmatedynamics.com/leader.html)

## Find out what skew costs your floor.

A Skew Audit on one station gives you the number in the first week.

[Request a Skew Audit](mailto:contact@checkmatedynamics.com?subject=Data%20station%20call%3A%20Skew%20Audit) | [Book a call](mailto:contact@checkmatedynamics.com?subject=Data%20station%20call%3A%20Sync%20Kit)
