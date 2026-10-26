/* Frozen documentary facts; no physical confidence upgrade. */
export const sourceSteps=[
  {
    "id": "S01",
    "OEM_step": 1,
    "pdf_page": 4,
    "printed_page": 3,
    "sequence_prerequisites": [],
    "introduced_part_ids": [
      "10",
      "12"
    ],
    "hardware": {
      "D": 4
    },
    "action": "Connect the two 10 panels to the ends of 12; align the indicated hole faces before seating D.",
    "receiving_and_access": "Across outer 10 faces toward 12 ends. Receiving geometry beyond depicted holes UNKNOWN.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S02",
    "OEM_step": 2,
    "pdf_page": 4,
    "printed_page": 3,
    "sequence_prerequisites": [
      "S01"
    ],
    "introduced_part_ids": [
      "11"
    ],
    "hardware": {
      "D": 4
    },
    "action": "Add both 11 dividers to the S1 module. Preserve Metal nuts / hole orientation.",
    "receiving_and_access": "D alignment follows inset through connecting panel toward divider end; exact buried receiver UNKNOWN.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S03",
    "OEM_step": 3,
    "pdf_page": 5,
    "printed_page": 4,
    "sequence_prerequisites": [
      "S02"
    ],
    "introduced_part_ids": [
      "9"
    ],
    "hardware": {
      "D": 4
    },
    "action": "Align panel9 over the module and place four D at the illustrated positions.",
    "receiving_and_access": "Broad-face access normal to panel9; support module and keep edge alignment visible.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S04",
    "OEM_step": 4,
    "pdf_page": 5,
    "printed_page": 4,
    "sequence_prerequisites": [
      "S03"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "B": 4,
      "K": 2
    },
    "action": "Add two K brackets at divider/broad-panel interfaces with two B per bracket.",
    "receiving_and_access": "Two perpendicular bolt axes in each K; underside view implies supported module reorientation, not a new OEM step.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S05",
    "OEM_step": 5,
    "pdf_page": 6,
    "printed_page": 5,
    "sequence_prerequisites": [
      "S04"
    ],
    "introduced_part_ids": [
      "13"
    ],
    "hardware": {
      "D": 7
    },
    "action": "Position 13 against the illustrated upper-module edges and insert seven D.",
    "receiving_and_access": "Approach normal to 13. Individual backing ownership of all seven positions needs mapping; no invented pilot detail.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S06",
    "OEM_step": 6,
    "pdf_page": 6,
    "printed_page": 5,
    "sequence_prerequisites": [
      "S05"
    ],
    "introduced_part_ids": [
      "15"
    ],
    "hardware": {
      "D": 10
    },
    "action": "Close the illustrated module face with 15, aligning all ten D positions.",
    "receiving_and_access": "Approach normal to 15. Keep partitions retained; source does not section each receiver.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S07",
    "OEM_step": 7,
    "pdf_page": 7,
    "printed_page": 6,
    "sequence_prerequisites": [
      "S06"
    ],
    "introduced_part_ids": [
      "1",
      "2",
      "5"
    ],
    "hardware": {
      "A": 5
    },
    "action": "Prepare four corner feet on frames1/2 and one on rail5. Keep rail5 available for S14.",
    "receiving_and_access": "Feet enter the illustrated frame ends/rail boss; no invented thread size or travel.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S08",
    "OEM_step": 8,
    "pdf_page": 7,
    "printed_page": 6,
    "sequence_prerequisites": [
      "S07"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "D": 10
    },
    "action": "Join frames1/2 to the completed upper module using ten D; obey square-pipe orientation in both insets.",
    "receiving_and_access": "Drawing is inverted relative to final use. Align through pipe faces to module points; do not animate a hidden unsupported flip.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S09",
    "OEM_step": 9,
    "pdf_page": 8,
    "printed_page": 7,
    "sequence_prerequisites": [
      "S08"
    ],
    "introduced_part_ids": [
      "4"
    ],
    "hardware": {
      "C": 4
    },
    "action": "Join rear frame4 between sides1/2 with four C, retaining all previous components.",
    "receiving_and_access": "External side-post approach to rear-frame ends as inset.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S10",
    "OEM_step": 10,
    "pdf_page": 8,
    "printed_page": 7,
    "sequence_prerequisites": [
      "S09"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "F": 4
    },
    "action": "Insert four F at the rear frame/module association and tighten as instructed after alignment.",
    "receiving_and_access": "Cross-drive access from pictured exposed rail face; no power tool. Exact each backing/shaft envelope not dimensioned.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S11",
    "OEM_step": 11,
    "pdf_page": 9,
    "printed_page": 8,
    "sequence_prerequisites": [
      "S10"
    ],
    "introduced_part_ids": [
      "3"
    ],
    "hardware": {
      "C": 4
    },
    "action": "Join front rail3 using four C; preserve its handle/tab direction.",
    "receiving_and_access": "External side-post approach; orientation inset is mandatory.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S12",
    "OEM_step": 12,
    "pdf_page": 9,
    "printed_page": 8,
    "sequence_prerequisites": [
      "S11"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "F": 4
    },
    "action": "Insert four F at front rail/module association and tighten after alignment.",
    "receiving_and_access": "Keep front and side alignment established; do not claim certified driver access.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S13",
    "OEM_step": 13,
    "pdf_page": 10,
    "printed_page": 9,
    "sequence_prerequisites": [
      "S12"
    ],
    "introduced_part_ids": [
      "6"
    ],
    "hardware": {
      "C": 4
    },
    "action": "Place four rails6 as shown, using only the four C assigned to S13.",
    "receiving_and_access": "Receiver at rail end is illustrated. Opposite-end capture/remaining C allocation is not fully explicit.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S14",
    "OEM_step": 14,
    "pdf_page": 10,
    "printed_page": 9,
    "sequence_prerequisites": [
      "S13"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "C": 6
    },
    "action": "Join prepared rail5 with centre A foot, preserve iron/tab direction and complete six C shown.",
    "receiving_and_access": "Likely completes four rail6 ends plus two rail5 ends, but this allocation is INFERRED and needs resolution before animation.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S15",
    "OEM_step": 15,
    "pdf_page": 11,
    "printed_page": 10,
    "sequence_prerequisites": [
      "S14"
    ],
    "introduced_part_ids": [
      "14"
    ],
    "hardware": {},
    "action": "Reorient to the illustrated upright state and lower floor14 onto the supports; no fastener added.",
    "receiving_and_access": "Turnover/support choreography is presentation staging, not an OEM instruction. Do not screw down14 without evidence.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S16",
    "OEM_step": 16,
    "pdf_page": 11,
    "printed_page": 10,
    "sequence_prerequisites": [
      "S15"
    ],
    "introduced_part_ids": [
      "7",
      "8"
    ],
    "hardware": {
      "E": 8
    },
    "action": "Position and support both doors; attach depicted hinge leaves using eight E.",
    "receiving_and_access": "Two E per hinge, four hinges shown. Inset screw studs are already part of depicted assemblies, not new loose hardware.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S17",
    "OEM_step": 17,
    "pdf_page": 12,
    "printed_page": 11,
    "sequence_prerequisites": [
      "S16"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "G": 2,
      "H": 2,
      "J": 2
    },
    "action": "Fit two J upper retaining tabs with two H and two G to the existing studs.",
    "receiving_and_access": "Source exploded order: stud, H, J, G outward. Do not assert a buried stud fastening method.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S18",
    "OEM_step": 18,
    "pdf_page": 12,
    "printed_page": 11,
    "sequence_prerequisites": [
      "S17"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "G": 2,
      "H": 2,
      "I": 2
    },
    "action": "Fit lower retaining tabs provisionally identified I by inset. Summary incorrectly/redundantly labels J.",
    "receiving_and_access": "Source exploded order: stud, H, I, G. I/J disposition remains unresolved; do not silently relabel.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  },
  {
    "id": "S19",
    "OEM_step": 19,
    "pdf_page": 13,
    "printed_page": 12,
    "sequence_prerequisites": [
      "S18"
    ],
    "introduced_part_ids": [],
    "hardware": {
      "N": 4
    },
    "action": "Apply four N pads at the two indicated positions on each opened door.",
    "receiving_and_access": "Source shows a release liner and mentions choosing own EVA pad. Exact contact action, placement coordinates and optionality need clarification.",
    "alignment_rule": "ALIGN_ALL_RELEVANT_COMPONENTS_BEFORE_FINAL_TIGHTENING",
    "state_rule": "Retain every previously installed component; no reset or disappearance",
    "confidence": "DOCUMENTED_ASSOCIATION_WITH_EXPLICIT_UNKNOWNS",
    "production_motion_validation": "NOT_RUN"
  }
] as const;
