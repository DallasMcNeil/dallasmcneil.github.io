
var templates = [
    // {
    //     name: "Basic 3x3",
    //     description: "3 rows of 3 badges for printing on a landscape A4 page, no schedule",
    //     link: "./templates/Standard-basic.html",
    //     isCertificate: false,
    //     pageWidth: 29.7,
    //     pageHeight: 21,
    //     pageRows: 3,
    //     pageColumns: 3,
    //     badgeWidth: 9.9,
    //     badgeHeight: 7,
    //     badgeScale: 1.0,
    // },
    // {
    //     name: "Book",
    //     description: "Individual portrait badge and schedule for printing on a single landscape A6 page",
    //     link: "./templates/Standard-book.html",
    //     isCertificate: false,
    //     pageWidth: 29.7,
    //     pageHeight: 21,
    //     pageRows: 1,
    //     pageColumns: 1,
    //     badgeWidth: 29.7,
    //     badgeHeight: 21,
    //     badgeScale: 1.0,
    // },
    // {
    //     name: "Book 2x2",
    //     description: "2 rows of 2 columns of portrait badges and schedule for printing on a landscape A4 page",
    //     link: "./templates/Standard-book.html",
    //     isCertificate: false,
    //     pageWidth: 29.7,
    //     pageHeight: 21,
    //     pageRows: 2,
    //     pageColumns: 2,
    //     badgeWidth: 29.7,
    //     badgeHeight: 21,
    //     badgeScale: 0.5,
    // },
    {
        name: "Landscape Book",
        description: "Individual landscape badges and schedule for printing on landscape A6 pages",
        generationFunction: MakeA6LandscapeBadges,
        isCertificate: false,
    },
    {
        name: "Landscape Book 2x2",
        description: "4 landscape badges and schedules for printing on landscape A4 pages",
        generationFunction: MakeA4LandscapeBadges,
        isCertificate: false,
    },
    // {
    //     name: "Certificate",
    //     description: "Landscape certificates for all events",
    //     generationFunction: MakeCertificates,
    //     isCertificate: true,
    // },
]

// Settings
var settings = {
    // General settings
    template: 0,
    // Badge settings
    includeStaffing: true,
    includeStations: true,
    hideStaffOnlyAssignments: false,
    showWcaLiveQrCode: true,
    // Certificate settings
    certOrganiser: "Name",
    certRole: "WCA DELEGATE",
    certBorderTint: "#006400",
    certTextColor: "#006400",
    certPageColor: "#dfefdf",
} 

// Set status text
const STATUS_MODE_INFO = 0;
const STATUS_MODE_WARN = 1;
const STATUS_MODE_ERROR = 2;
function SetStatus(text, mode) {
    $("#status").removeClass();
    $("#status").text(text);
    if (mode == STATUS_MODE_WARN) {
        $("#status").addClass("warn");
    } else if (mode == STATUS_MODE_ERROR) {
        $("#status").addClass("error");
    } else {
        $("#status").addClass("info");
    }
}

var activities;
var wcif;
function GetActivities() {
    // Reorganise activity information
    activities = {}
    for (var v=0; v<wcif.schedule.venues.length; v++) {
        var venue = wcif.schedule.venues[v];
        for (var r=0; r<venue.rooms.length; r++) {
            var room = venue.rooms[r];
            for (var a=0; a<room.activities.length; a++) {
                var activity = room.activities[a];

                activities[activity.id] = {
                    parentActivityCode: activity.activityCode,
                    activityCode: activity.activityCode,
                    roundStartTime: activity.startTime,
                    roundEndTime: activity.endTime,
                    timezone: venue.timezone,
                }

                for (var c=0; c<activity.childActivities.length; c++) {
                    var childActivity = activity.childActivities[c];

                    activities[childActivity.id] = {
                        parentActivityCode: activity.activityCode,
                        activityCode: childActivity.activityCode,
                        roundStartTime: activity.startTime,
                        roundEndTime: activity.endTime,
                        timezone: venue.timezone,
                    }
                }
            }
        }
    }
}

// Load images of all the countries referenced in the WCIF
function LoadCountryFlags() {
    var flags = {}

    for (var person in wcif.persons) {
        var code = wcif.persons[person].countryIso2.toLowerCase();
        if (flags[code] == undefined) {
            flags[code] = true;
            var flagElement = $(`<img style="display: none;" id='${code}-flag' src='https://flagcdn.com/h80/${code}.png'/>`)
            $("#hidden-images").append(flagElement);
            console.log(`Added flag: ${code}`)
        }
    }
}

// Load a WCIF file from the user
function ReadWCIF(input) {
    // Get file
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        // Check WCIF
        try {
            wcif = JSON.parse(fileReader.result);
            $("#wcifFileLabel").text(file.name);

            GetActivities();
            LoadCountryFlags();
        } catch {
            SetStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }
        if (wcif == undefined) {
            SetStatus("Invalid WCIF file provided: Couldn't parse JSON", STATUS_MODE_ERROR);
            return;
        }

        SetStatus("Loaded WCIF file", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read WCIF file", STATUS_MODE_ERROR);
    }; 
}

function UseDemoWCIF() {
    wcif = demoWcif;
    $("#wcifFileLabel").text("SouthAustralianOpen2022.json");
    GetActivities();
    LoadCountryFlags();
}


// Read background image from user
function ReadBackgroundImage(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        backgroundImage = fileReader.result;
        console.log(backgroundImage)
        $("#background-img").attr("src",backgroundImage);
        $("#backgroundImgLabel").text(file.name);

        SetStatus("Updated background image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 
}

// Read organization image from user
function ReadOrganizationImage(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        organizationImage = fileReader.result;

        // Add organization image css to style badges
        $("#org-img").attr("src",organizationImage);
        $("#orgLogoLabel").text(file.name);

        SetStatus("Updated organization image", STATUS_MODE_INFO);
    }; 
    fileReader.onerror = function() {
        SetStatus("Couldn't read image file", STATUS_MODE_ERROR);
    }; 
}

// Template has been selected, chang settings and UI
function TemplateChanged(select) {
    settings.template = Number(select.value);
    $("#template-description").text(templates[settings.template].description);

    if (templates[settings.template].isCertificate) {
        $(".badge-only").hide();
        $(".certificate-only").show();
    } else {
        $(".badge-only").show();
        $(".certificate-only").hide();
    }
}

function GenerateDocument() {
    SetStatus("Generating PDF...", STATUS_MODE_INFO);
    setTimeout(() => {
        try {
            var error = !MakeDocument();
            if (!error) {
                // Allow document to be printed
                $("#print-button").prop("disabled", false);

                var blob = globalDoc.output('blob')
                var blob_url = URL.createObjectURL(blob);
                $("#document-preview").attr("src", blob_url)
                $("#document-preview").show();
                
                SetStatus("PDF ready!", STATUS_MODE_INFO);
            }
        } catch {
            $("#print-button").prop("disabled", true);
            SetStatus("PDF failed to generate", STATUS_MODE_ERROR);
        }
    }, 100);
}

function PrintDocument() {
    globalDoc.save("Badges.pdf");
}

$(document).ready(function () {
    // Setup template dropdown
    var option = '';
    for (var i=0;i<templates.length;i++) {
        if (!templates[i].isCertificate) {
            option += '<option value="' + i + '">' + templates[i].name + '</option>';
        }
    }
    option += '<option disabled>──────────</option>'
    for (var i=0;i<templates.length;i++) {
        if (templates[i].isCertificate) {
            option += '<option value="' + i + '">' + templates[i].name + '</option>';
        }
    }
    $('#select-template').html(option);
    $('#select-template').val(String(settings.template));
    $("#template-description").text(templates[settings.template].description);

    $(".certificate-only").hide();

    $("#document-preview").hide();
});