// Palette of colors a type can be bound to. Custom types pick a color from here.
export const TYPE_PALETTE = [
    "#7BC67E", // green
    "#A0E0A3", // light green
    "#E0697B", // red/pink
    "#F2A65A", // orange
    "#F6D35B", // yellow
    "#5AA9E6", // blue
    "#7FC8F8", // light blue
    "#9B6DD6", // purple
    "#E08AC0", // pink
    "#4DB6AC", // teal
    "#B0BEC5", // grey
    "#8D6E63", // brown
];

const eventsConst = {
    // Each type is { name, color }. Color is bound to the type and stored on the
    // event (EventInfo.color), so the schedule can render the type's color.
    type: [
        { name: "Lecture", color: "#A0E0A3" },
        { name: "Lesson", color: "#A0E0A3" },
        { name: "Seminar", color: "#7FC8F8" },
        { name: "Webinar", color: "#5AA9E6" },
        { name: "Workshop", color: "#7BC67E" },
        { name: "Laboratory", color: "#7BC67E" },
        { name: "Panel Discussion", color: "#9B6DD6" },
        { name: "Conference", color: "#9B6DD6" },
        { name: "Networking Event", color: "#4DB6AC" },
        { name: "Corporate Meeting", color: "#F2A65A" },
        { name: "Team Building", color: "#F6D35B" },
        { name: "Product Launch", color: "#E08AC0" },
        { name: "Award Ceremony", color: "#F6D35B" },
        { name: "Notification", color: "#E0697B" },
    ],
    tag: [
        "Education",
        "Technology",
        "Health",
        "Business",
        "Art",
        "Music",
        "Science",
        "Networking",
        "Productivity",
        "Leadership"
    ],
    platform: [
        "Zoom",
        "Google Meet",
        "Microsoft Teams",
        "Webex",
        "Skype",
        "Discord",
        "YouTube Live",
        "Facebook Live",
        "Twitch",
        "In-Person"
    ]
}

// Fallback color used when an event has no bound color (legacy records or unknown type).
export const DEFAULT_TYPE_COLOR = "#E08AC0";

// Fallback length (minutes) when an event is created without an explicit duration.
export const DEFAULT_EVENT_DURATION = 90;

// Resolve a color for a type name from the predefined list (case-insensitive).
export const colorForType = (typeName) => {
    if (!typeName) return DEFAULT_TYPE_COLOR;
    const match = eventsConst.type.find(
        (t) => t.name.toLowerCase() === String(typeName).toLowerCase()
    );
    return match ? match.color : DEFAULT_TYPE_COLOR;
};

export default eventsConst;
