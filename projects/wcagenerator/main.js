var wcif = undefined
var backgroundImage = ""

var badgeTemplates = [
    {
        name: "SCA Basic 3x3",
        description: "3 rows of 3 badges for printing on a landscape A4 page, no schedule",
        link: "./templates/SCA-standard.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 3,
        pageColumns: 3,
        badgeWidth: 9.9,
        badgeHeight: 7,
        badgeScale: 1.0,
    },
    {
        name: "SCA Book",
        description: "Individual badge and schedule for printing on a single landscape A6 page",
        link: "./templates/SCA-book.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 1,
        pageColumns: 1,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 1.0,
    },
    {
        name: "SCA Book 2x2",
        description: "2 rows of 2 columns of badges and schedule for printing on a landscape A4 page",
        link: "./templates/SCA-book.html",
        pageWidth: 29.7,
        pageHeight: 20.9818,
        pageRows: 2,
        pageColumns: 2,
        badgeWidth: 29.7,
        badgeHeight: 20.9818,
        badgeScale: 0.5,
    }
]

var settings = {
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

    var template = badgeTemplates[settings.template];

    $("#template").load(template.link, function() {

        $("#template").hide(); 

        var doc = $("#print-document");
        doc.empty();
    
        doc.css("width",`${template.pageWidth}cm`);
    
        var index = 0;
        var pageIndex = 0;
        var badgeIndex = 0;
        
        while (true) {
            if (badgeIndex >= (template.pageRows * template.pageColumns)) {
                if (index >= persons.length) {
                    break;
                }
                pageIndex+=1;
                badgeIndex=0;
            }
    
            if (badgeIndex == 0) {
                var newPage = $(`<div class='print-page' style='width:${template.pageWidth}cm;height:${template.pageHeight}cm'></div>`)
                newPage.css("transform",`scale(${1.0 - settings.marginPercentage})`)
                doc.append(newPage)
            }
    
            var badge = $('#badge-template').children().first().clone();
            badge.css("width",`${template.badgeWidth}cm`);
            badge.css("height",`${template.badgeHeight}cm`);
            badge.css("transform",`scale(${template.badgeScale})`)
            badge.css("transform-origin",`0% 0%`)
            badge.removeAttr("id");
            badge.show();
            if (index >= persons.length) {
                badge.find(".wca-name").first().text(" ");
                badge.find(".wca-id").first().text(" ");
            } else {
                badge.find(".wca-name").first().text(persons[index].name);
                badge.find(".wca-id").first().text(persons[index].wcaId);
            }
            badge.css("top", `${(Math.floor(badgeIndex / template.pageColumns)) * template.badgeHeight * template.badgeScale}cm`)
            badge.css("left", `${(badgeIndex % template.pageRows) * template.badgeWidth * template.badgeScale}cm`)
    
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

// Set badge dropdown
var option = '';
for (var i=0;i<badgeTemplates.length;i++){
   option += '<option value="' + i + '">' + badgeTemplates[i].name + '</option>';
}
$('#select-template').html(option);
$('#select-template').val(String(settings.template));
$('#select-template').on('change', function() {
    settings.template = Number(this.value);
});

setTimeout(function() {
    generate();
}, 1000);

