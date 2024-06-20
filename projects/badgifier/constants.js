
// Week day to text
const weekDaysMap = [
    "Sunday", 
    "Monday", 
    "Tuesday", 
    "Wednesday", 
    "Thursday", 
    "Friday", 
    "Saturday", 
]

// Event code to full name
const eventMap = {
    "222": "2x2x2",
    "333": "3x3x3",
    "333fm": "3x3x3 Fewest Moves",
    "333ft": "3x3x3 With Feet",
    "333oh": "3x3x3 One-Handed",
    "333mbf": "3x3x3 Multi-Blind",
    "333bf": "3x3x3 Blindfolded",
    "444bf": "4x4x4 Blindfolded",
    "555bf": "5x5x5 Blindfolded",
    "444": "4x4x4",
    "555": "5x5x5",
    "666": "6x6x6",
    "777": "7x7x7",
    "sq1": "Square-1",
    "clock": "Clock",
    "minx": "Megaminx",
    "pyram": "Pyraminx",
    "skewb": "Skewb",
    "other": "Other",
}

const eventCount = 18;
const eventOrder = {
    "333":0,
    "222":1,
    "444":2,
    "555":3,
    "666":4,
    "777":5,
    "333bf":6,
    "333fm":7,
    "333oh":8,
    "clock":9,
    "minx":10,
    "pyram":11,
    "skewb":12,
    "sq1":13,
    "444bf":14,
    "555bf":15,
    "333mbf":16,
    "333ft":17,
}

const eventOrderName = [
    "333",
    "222",
    "444",
    "555",
    "666",
    "777",
    "333bf",
    "333fm",
    "333oh",
    "clock",
    "minx",
    "pyram",
    "skewb",
    "sq1",
    "444bf",
    "555bf",
    "333mbf",
    "333ft",
]

// Award place to text
const placeMap = [
    "First Place awarded to:", 
    "Second Place awarded to:", 
    "Third Place awarded to:",  
]

// Format code to event result prefix text
const eventFormatMap = {
    "a":"Average time of:",
    "m":"Mean time of:",
    "1":"Best time of:",
    "2":"Best time of:",
    "3":"Best time of:",
}

const eventCharacters = {
    "333":"\u{E601}",
    "222":"\u{E600}",
    "444":"\u{E607}",
    "555":"\u{E609}",
    "666":"\u{E60B}",
    "777":"\u{E60C}",
    "333bf":"\u{E602}",
    "333fm":"\u{E603}",
    "333oh":"\u{E606}",
    "clock":"\u{E60D}",
    "minx":"\u{E60E}",
    "pyram":"\u{E60F}",
    "skewb":"\u{E610}",
    "sq1":"\u{E611}",
    "444bf":"\u{E608}",
    "555bf":"\u{E60A}",
    "333mbf":"\u{E605}",
    "333ft":"\u{E604}",
}

// Special case text for certain events
const multiblindFormatText = "Best result:"
const fewestMovesFormatText = "Moves:"

const localizedNames = {
    AG: "Antigua and Barbuda",
    BA: "Bosnia and Herzegovina",
    CD: "Democratic Republic of the Congo",
    CG: "Congo",
    CI: "Côte d'Ivoire",
    CV: "Cabo Verde",
    FM: "Federated States of Micronesia",
    GW: "Guinea Bissau",
    HK: "Hong Kong, China",
    KN: "Saint Kitts and Nevis",
    KP: "Democratic People's Republic of Korea",
    KR: "Republic of Korea",
    LC: "Saint Lucia",
    MK: "North Macedonia",
    MM: "Myanmar",
    MO: "Macau, China",
    PS: "Palestine",
    ST: "São Tomé and Príncipe",
    SZ: "Eswatini",
    TT: "Trinidad and Tobago",
    TW: "Chinese Taipei",
    VC: "Saint Vincent and the Grenadines",
    XF: "Multiple Countries (Africa)",
    XM: "Multiple Countries (Americas)",
    XA: "Multiple Countries (Asia)",
    XE: "Multiple Countries (Europe)",
    XN: "Multiple Countries (North America)",
    XO: "Multiple Countries (Oceania)",
    XS: "Multiple Countries (South America)",
    XW: "Multiple Countries (World)",
}

const localizedFlags = {
    TW: "./images/ChineseTaipeiSquared.png",
}

const noFlagBorders = {
    NP: false,
    TW: false,
}

function getCountryFlag(code) {
    if (localizedFlags[code.toUpperCase()] == undefined) {
        return `https://flagcdn.com/h240/${code}.png`
    }
    return localizedFlags[code.toUpperCase()]
}

let regionNames = new Intl.DisplayNames(['en'], {type: 'region'});
function getCountryName(code) {
    if (localizedNames[code] == undefined) {
        return regionNames.of(code.toUpperCase())
    }
    return localizedNames[code.toUpperCase()]
}