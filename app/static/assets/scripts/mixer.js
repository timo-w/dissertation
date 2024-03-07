console.log("Sanity check from mixer.js.");

const sliders = document.getElementsByClassName("slider");
const slider_labels = document.getElementsByClassName("slider-label");
const slider_toggles = document.getElementsByClassName("slider-toggle");

// Slide volume slider to target
function slideChannel(channel, label, target) {
    const slideInterval = setInterval(
        () => {
            if (channel.value > target) {
                channel.value--;
                channel.style.backgroundColor = "#DDD";
                label.innerHTML = channel.value;
            } else if (channel.value < target) {
                channel.value++;
                channel.style.backgroundColor = "#DDD";
                label.innerHTML = channel.value;
            } else {
                clearInterval(slideInterval);
                channel.style.backgroundColor = "";
            }
            $(channel).trigger("input");
        }, 10 // <- delay in ms
    );
}


$(document).ready(function(){

    // Enable/disable tracks
    $(".channel a").click(function() {
        $(this).toggleClass("active");
        uiTrack.soundButton();
        this.innerHTML = $(this).hasClass("active") ? 'ON' : 'OFF';
    });

    // Volume sliders
    for (let i=0; i<sliders.length; i++) {
        sliders.item(i).addEventListener("input", () => {
            slider_labels.item(i).innerHTML = sliders.item(i).value;
            if (sliders.item(i).value % 10 == 0) {
                uiTrack.soundNotch();
            }
        });
    };

    // Reset mixer to default state
    $("#mixer-reset").click(function() {
        uiTrack.soundButton();
        for (let i=0; i<sliders.length-1; i++) {
            slideChannel(sliders.item(i), slider_labels.item(i), 0);
            $(slider_toggles.item(i)).addClass("active").text('ON');
        }
        slideChannel(sliders.item(4), slider_labels.item(4), 100);
    });

    // Set mixer to preset values
    $("#mixer-preset-1").click(function() {
        uiTrack.soundButton();
        slideChannel(sliders.item(0), slider_labels.item(0), 0);
        $(slider_toggles.item(0)).removeClass("active").text('OFF');
        slideChannel(sliders.item(1), slider_labels.item(1), 100);
        $(slider_toggles.item(1)).addClass("active").text('ON');
        slideChannel(sliders.item(2), slider_labels.item(2), 52);
        $(slider_toggles.item(2)).addClass("active").text('ON');
        slideChannel(sliders.item(3), slider_labels.item(3), 13);
        $(slider_toggles.item(3)).addClass("active").text('ON');
        slideChannel(sliders.item(4), slider_labels.item(4), 86);
        $(slider_toggles.item(4)).addClass("active").text('ON');
    });
    $("#mixer-preset-2").click(function() {
        uiTrack.soundButton();
        slideChannel(sliders.item(0), slider_labels.item(0), 75);
        $(slider_toggles.item(0)).addClass("active").text('ON');
        slideChannel(sliders.item(1), slider_labels.item(1), 0);
        $(slider_toggles.item(1)).removeClass("active").text('OFF');
        slideChannel(sliders.item(2), slider_labels.item(2), 62);
        $(slider_toggles.item(2)).addClass("active").text('ON');
        slideChannel(sliders.item(3), slider_labels.item(3), 93);
        $(slider_toggles.item(3)).addClass("active").text('ON');
        slideChannel(sliders.item(4), slider_labels.item(4), 0);
        $(slider_toggles.item(4)).removeClass("active").text('OFF');
    });
    

});