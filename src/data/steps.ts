import type { AssemblyStep, DroneColor } from '../types'

// Station / operator identity. In production these come from the sign-in /
// work-order context.
export const OPERATOR = 'OP-014 · Awaiz Ahmed'
export const STATION_ID = 'STN-DRN-02'
export const WORK_ORDER = 'WO-2026-0488'

// The three body colour-ways. The operator picks one before the build starts;
// it selects the part-image folder and themes the station UI.
export const DRONE_COLORS: DroneColor[] = [
  { id: 'blue', name: 'Cobalt Blue', hex: '#2566c8' },
  { id: 'orange', name: 'Safety Orange', hex: '#e8772e' },
  { id: 'grey', name: 'Titanium Grey', hex: '#9a9081' },
]

export const DEFAULT_COLOR = DRONE_COLORS[0]

// The 26-part drone assembly kit. `img` is the part-image key (resolves to
// /drone-parts/<color>/<img>.png across all three colour-ways). `pn` is the
// digit string the camera must OCR-match. `qty` follows the BOM call-out.
export const steps: AssemblyStep[] = [
  {
    id: 'main-frame',
    name: 'Main frame / center plate',
    code: 'Main Frame · FRM-1001',
    pn: '1001',
    qty: '1 Qt',
    instruction:
      'Seat the main center plate on the assembly jig — it carries the arms, battery, flight controller and camera mount, so align it square to the fixture pins.',
    img: 'main_frame',
  },
  {
    id: 'top-cover',
    name: 'Top cover / protective canopy',
    code: 'Top Cover · CAN-1002',
    pn: '1002',
    qty: '1 Qt',
    instruction:
      'Set the protective canopy aside for now — it caps the electronics and gives the body its finished shell. Confirm the camera window is clear of flash.',
    img: 'top_cover',
  },
  {
    id: 'gps-mast',
    name: 'GPS mast / antenna mount',
    code: 'GPS Mast · GPS-1003',
    pn: '1003',
    qty: '1 Qt',
    instruction:
      'Mount the GPS / antenna mast on top of the frame. It holds the GPS antenna and signal accessory — keep it clear of the propeller arc.',
    img: 'gps_mast',
  },
  {
    id: 'front-arms',
    name: 'Front-left & front-right arms',
    code: 'Front Arms · ARM-1004',
    pn: '1004',
    qty: '2 Qt',
    instruction:
      'Bolt the two front arms to the main frame. They carry the front motors and propellers — torque each in a cross pattern.',
    img: 'front_arms',
  },
  {
    id: 'rear-arms',
    name: 'Rear-left & rear-right arms',
    code: 'Rear Arms · ARM-1005',
    pn: '1005',
    qty: '2 Qt',
    instruction:
      'Bolt the two rear arms to the main frame. They carry the rear motors and balance the drone in flight.',
    img: 'rear_arms',
  },
  {
    id: 'front-props',
    name: 'Front propeller pair',
    code: 'Front Props · PRP-1006',
    pn: '1006',
    qty: '2 Qt',
    instruction:
      'Stage the front propeller pair — they create forward lift. Match each blade rotation direction to its front motor.',
    img: 'front_props',
  },
  {
    id: 'rear-props',
    name: 'Rear propeller pair',
    code: 'Rear Props · PRP-1007',
    pn: '1007',
    qty: '2 Qt',
    instruction:
      'Stage the rear propeller pair — they balance the drone during flight. Match each blade rotation direction to its rear motor.',
    img: 'rear_props',
  },
  {
    id: 'prop-blades',
    name: 'Propeller blades',
    code: 'Prop Blades · PRB-1008',
    pn: '1008',
    qty: '1 Set',
    instruction:
      'Verify the replacement blade set. These are the spinning surfaces that push air downward — inspect each for nicks before fitting.',
    img: 'prop_blades',
  },
  {
    id: 'motor-mounts',
    name: 'Motor mounts / hubs',
    code: 'Motor Mounts · MNT-1009',
    pn: '1009',
    qty: '4 Qt',
    instruction:
      'Fit the four motor mounts to the arm ends. They hold the brushless motors securely against vibration.',
    img: 'motor_mounts',
  },
  {
    id: 'motors',
    name: 'Brushless drone motors',
    code: 'Brushless Motor · MTR-1010',
    pn: '1010',
    qty: '4 Qt',
    instruction:
      'Mount the four brushless motors to the hubs and torque each screw to 0.6 Nm in a cross pattern.',
    img: 'motor',
  },
  {
    id: 'battery',
    name: 'LiPo battery pack',
    code: 'LiPo Battery · BAT-1011',
    pn: '1011',
    qty: '1 Qt',
    instruction:
      'Insert the LiPo training battery into the chassis cradle and secure it with the strap. It powers the motors and electronics.',
    img: 'battery',
  },
  {
    id: 'flight-controller',
    name: 'Flight controller',
    code: 'Flight Controller · FC-1012',
    pn: '1012',
    qty: '1 Qt',
    instruction:
      'Stack the flight controller — the brain of the drone — onto the soft-mount grommets with the heading arrow facing forward.',
    img: 'flight_controller',
  },
  {
    id: 'motor-wires',
    name: 'Motor wires / connector cables',
    code: 'Motor Wires · WIR-1013',
    pn: '1013',
    qty: '1 Set',
    instruction:
      'Route the connector cables between motors, ESCs, battery and flight controller. They carry both power and control signals.',
    img: 'motor_wires',
  },
  {
    id: 'shock-absorbers',
    name: 'Shock absorbers',
    code: 'Shock Absorbers · SHK-1014',
    pn: '1014',
    qty: '4 Qt',
    instruction:
      'Fit the shock absorbers to damp motor vibration and landing impact — they protect the sensitive electronics and camera.',
    img: 'shock_absorbers',
  },
  {
    id: 'springs',
    name: 'Springs',
    code: 'Springs · SPR-1015',
    pn: '1015',
    qty: '4 Qt',
    instruction:
      'Seat the damping springs with the shock absorbers and landing supports for vibration control.',
    img: 'springs',
  },
  {
    id: 'suspension-arms',
    name: 'Suspension arms / braces',
    code: 'Suspension Arms · SUS-1016',
    pn: '1016',
    qty: '2 Qt',
    instruction:
      'Add the support braces to stiffen the arms and underside frame — they keep the drone stable and rigid.',
    img: 'suspension_arms',
  },
  {
    id: 'steering-linkage',
    name: 'Steering / gimbal linkage',
    code: 'Gimbal Linkage · LNK-1017',
    pn: '1017',
    qty: '1 Qt',
    instruction:
      'Install the linkage mechanism for camera tilt and adjustable mounting. Check it moves freely through its full travel.',
    img: 'steering_linkage',
  },
  {
    id: 'screws',
    name: 'Screws',
    code: 'Screws · FAS-1018',
    pn: '1018',
    qty: '1 Pk',
    instruction:
      'Confirm the screw pack — used throughout to fasten the frame, arms, motors, brackets, canopy and electronics.',
    img: 'screws',
  },
  {
    id: 'nuts',
    name: 'Nuts',
    code: 'Nuts · FAS-1019',
    pn: '1019',
    qty: '1 Pk',
    instruction:
      'Confirm the nut pack — used with the screws and bolts to lock parts together during assembly.',
    img: 'nuts',
  },
  {
    id: 'washers',
    name: 'Washers',
    code: 'Washers · FAS-1020',
    pn: '1020',
    qty: '1 Pk',
    instruction:
      'Confirm the washer pack — placed between fasteners and parts to spread pressure and improve the joint.',
    img: 'washers',
  },
  {
    id: 'white-spacers',
    name: 'White spacers / bushings',
    code: 'Spacers · SPC-1021',
    pn: '1021',
    qty: '1 Pk',
    instruction:
      'Confirm the spacer set — used to create stand-off between the frame, flight controller, canopy and electronics boards.',
    img: 'white_spacers',
  },
  {
    id: 'mounting-brackets',
    name: 'Small mounting brackets',
    code: 'Brackets · BRK-1022',
    pn: '1022',
    qty: '4 Qt',
    instruction:
      'Fit the small brackets that attach wires, sensors, camera parts and canopy supports to the frame.',
    img: 'mounting_brackets',
  },
  {
    id: 'camera-module',
    name: 'Camera module',
    code: 'Camera · CAM-1023',
    pn: '1023',
    qty: '1 Qt',
    instruction:
      'Mount the camera module at the front for viewing, recording and FPV operation. Keep the lens covered until final.',
    img: 'camera_module',
  },
  {
    id: 'landing-gear',
    name: 'Landing gear / skid legs',
    code: 'Landing Gear · LND-1024',
    pn: '1024',
    qty: '2 Qt',
    instruction:
      'Attach the skid legs underneath. They support the drone on landing and protect the frame, battery and camera.',
    img: 'landing_gear',
  },
  {
    id: 'propeller-guards',
    name: 'Propeller guards',
    code: 'Prop Guards · GRD-1025',
    pn: '1025',
    qty: '4 Qt',
    instruction:
      'Fit the propeller guards around the blades to protect them and improve safety during training flights.',
    img: 'propeller_guards',
  },
  {
    id: 'esc-modules',
    name: 'ESC speed controllers',
    code: 'ESC Module · ESC-1026',
    pn: '1026',
    qty: '1 Qt',
    instruction:
      'Connect the ESC modules between the flight controller and motors — they control the speed of each brushless motor.',
    img: 'esc_modules',
  },
]
