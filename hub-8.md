# Hub 8 Pro

Source: https://checkmatedynamics.com/hub-8.html

[Products](https://checkmatedynamics.com/products.html) / D — Power & connect / D1 | Eight-port node hub

Powers, connects and protects a whole arm of nodes. Every port is its own USB-C power source and its own CAN segment, so one damaged cable can’t take the rest down.

**D1 · Hub 8 Pro** | Hub only; power supply optional | **$399**

[Talk to us](mailto:contact@checkmatedynamics.com?subject=Parts%20and%20OEM%20enquiry%3A%20Hub%208%20Pro) | [Book a call](mailto:contact@checkmatedynamics.com?subject=Data%20station%20call%3A%20Hub%208%20Pro)

Ships inside the Checkmate Leader and on its own.

*P1–P8 · node ports, PD + CAN each* *Machined 6061 case*

**Fig. 01** Hub 8 Pro, port side Concept render

Key figures

- **Node ports**: 8 + 2 accessory
- **Port power**: 20 V / 1.5 A Design
- **Bus**: CAN-FD star
- **Power in**: 12–48 V DC
- **Host**: 1 × USB
- **E-stop**: 2-channel NC

218 mm

120 mm

Plan view, to scale, est. | Diagram

**01** Overview

## A star, not a chain.

01

### Eight node ports

Plus two accessory ports for a Sync Beacon or Contour, and an upstream port to chain hubs for bimanual stations.

02

### Power per port

Each port is a USB-C PD source: off when empty, 20 V at 1.5 A once a node asks for it, and 3 A on up to two ports.

03

### Isolated CAN

Every port is its own CAN segment, bridged inside the hub. A crushed cable is cut off; the others keep running.

04

### Hardware e-stop

A two-channel input removes motor power in hardware, with no firmware in the path.

**02** Host

## One cable to the PC, one device for every node.

The hub appears as a single USB device whose CAN channels show up as standard SocketCAN interfaces on Linux. Each node’s own USB stays reachable for setup and updates.

- CAN-FD for SmartServo G, classic CAN for SmartStepper and accessories
- Shared 20 V motor rail: one node’s braking feeds another
- Per-port power and bus telemetry
- Machined aluminum case

*Power in* *E-stop · link · sync*

**Fig. 02** Rear panel Concept render

**03** Bus cable

**Fig. 03** A node’s USB-C cable held by the Cable Clip Concept render

## Power, USB and CAN on one cable.

Every Checkmate device uses its own USB-C port as the bus. Any full-featured USB-C cable carries all three; charge-only cables won’t carry CAN.

- One cable and one Cable Clip (anodized 6061) ship in every node box; extra clips $9
- The Clip Bar 8 screws across all eight ports and clamps every cable, so a snag can’t pull a joint offline

**04** Specification

| Ports | 8 node · 2 accessory · 1 upstream; USB-C with M2 threads for the Clip Bar 8 |
|---|---|
| Port power | USB-C PD source per port: 5 V on attach, 20 V / 1.5 A on request; 3 A on up to 2 ports |
| Bus | Active CAN star with CAN-FD and classic domains; ports isolated |
| Host link | One USB device per hub; SocketCAN-compatible channels |
| Safety | Two-channel normally-closed e-stop input; hardware cut of motor power |
| Power in | 12–48 V DC or USB-C PD; supply optional |
| Enclosure | Machined 6061 aluminum, about 218 × 120 × 34 mm Design |
| Cascading | Second hub’s upstream port into an accessory port; one hub per arm |

Design values for the current board. A unit has not been measured yet; each shipped unit comes with its own measured test card.

**05** Figures

## The hub from other angles.

**Fig. 04** Exploded: lid, board, base

**Fig. 05** Cut-away, port side

**Fig. 06** Top

Related: [Checkmate Leader](https://checkmatedynamics.com/leader.html) · [Sync Kit](https://checkmatedynamics.com/sync-kit.html) · [SmartServo G](https://checkmatedynamics.com/smartservo-g.html) · [Components](https://checkmatedynamics.com/components.html)

## Eight nodes on one hub.

[Talk to us](mailto:contact@checkmatedynamics.com?subject=Parts%20and%20OEM%20enquiry%3A%20Hub%208%20Pro) | [Components](https://checkmatedynamics.com/components.html)
