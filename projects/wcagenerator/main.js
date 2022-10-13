
var wcif = undefined
var backgroundImage = ""

var badgeFormats = [
    {
        name: "A4 Basic 3x3",
        description: "3 rows of 3 badges for printing on a landscape A4 page, no schedule",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 3,
        pageColumns: 3,
        badgeWidth: 9.9,
        badgeHeight: 7,
        templates: [
            {
                name: "SCA Standard",
                link: "./templates/SCA-standard.html",
            }
        ]
    },
    {
        name: "A6 Book",
        description: "Individual badge and schedule for printing on a single landscape A6 page",
        pageWidth: 10.5,
        pageHeight: 14.85,
        pageRows: 1,
        pageColumns: 1,
        badgeWidth: 10.5,
        badgeHeight: 14.85,
        templates: [
            {
                name: "SCA Book",
                link: "./templates/SCA-book.html",
            }
        ]
    }
]

var settings = {
    badgeFormat: 0,
    template: 0,
    customTemplate: false,
    marginPercentage: 0.05,
}

function readWCIF(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsText(file); 
    fileReader.onload = function() {
        wcif = JSON.parse(fileReader.result);
        if (wcif == undefined)
        {
            alert("Invalid WCIF file provided");
        }
    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function readBackground(input) {
    let file = input.files[0]; 
    let fileReader = new FileReader(); 
    fileReader.readAsDataURL(file); 
    fileReader.onload = function() {
        backgroundImage = fileReader.result;

        $("#background-image-style").remove()
        var backgroundImageStyle = $(`<style id='background-image-style'>.badge {background-image:url('${backgroundImage}');}</style>`)
        $("body").append(backgroundImageStyle);

    }; 
    fileReader.onerror = function() {
        alert(fileReader.error);
    }; 
}

function generate() {
    if (wcif == undefined) {
        console.log("Missing WCIF data")
        return;
    }

    var persons = wcif.persons.filter((a) => {
        if (a.registration != null) {
            if (a.registration.status == "accepted") {
                return true;
            }
        }
        return false;
    })

    persons.sort((a,b) => {
        if (a.name < b.name) {
            return -1;
        }
        if (a.name > b.name) {
            return 1;
        }
        return 0;
    });

    var format = badgeFormats[settings.badgeFormat];
    var template = format.templates[settings.template];

    $("#template").load(template.link, function() {

        $("#template").hide(); 

        var doc = $("#print-document");
        doc.empty();
    
        doc.css("width",`${format.pageWidth}cm`);
    
        var index = 0;
        var pageIndex = 0;
        var badgeIndex = 0;
        
        while (true) {
            if (badgeIndex >= (format.pageRows * format.pageColumns)) {
                if (index >= persons.length) {
                    break;
                }
                pageIndex+=1;
                badgeIndex=0;
            }
    
            if (badgeIndex == 0) {
                var newPage = $(`<div class='print-page' style='width:${format.pageWidth}cm;height:${format.pageHeight}cm'></div>`)
                newPage.css("transform",`scale(${1.0 - settings.marginPercentage})`)
                doc.append(newPage)
            }
    
            var badge = $('#badge-template').children().first().clone();
            badge.css("width",`${format.badgeWidth}cm`);
            badge.css("height",`${format.badgeHeight}cm`);
            badge.removeAttr("id");
            badge.show();
            if (index >= persons.length) {
                badge.find(".wca-name").first().text(" ");
                badge.find(".wca-id").first().text(" ");
            } else {
                badge.find(".wca-name").first().text(persons[index].name);
                badge.find(".wca-id").first().text(persons[index].wcaId);
            }
            badge.css("top", `${(Math.floor(badgeIndex / format.pageColumns)) * format.badgeHeight}cm`)
            badge.css("left", `${(badgeIndex % format.pageRows) * format.badgeWidth}cm`)
    
            var page = doc.find(".print-page").last();
            page.append(badge);
    
            badgeIndex+=1;
            index+=1;
        }
    });
}

function print() {
    var printwin = window.open("");

    printwin.document.open();
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./style.css"></head><body>');
    printwin.document.write('<html><head><link rel="stylesheet" type="text/css" href="./print.css"></head><body>');
    printwin.document.write($("#badge-template-style").prop('outerHTML'));
    if ($("#background-image-style").prop('outerHTML') != undefined) {
        printwin.document.write($("#background-image-style").prop('outerHTML'));
    }
    printwin.document.write($("#print-document").prop('outerHTML'));
    printwin.document.write('</body></html>');
    printwin.document.close();

    setTimeout(function() {
        printwin.print();
        printwin.stop();
        printwin.close();
    }, 1000);
}

setTimeout(function() {
    generate();
}, 1000);
