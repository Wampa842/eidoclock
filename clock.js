var has_notified = false;
var nice_background = true;
var simple_layout = false;
var eido_timestamp = 1510884902;
var alarms = [];

getCetusTime(1, function(t) {
    eido_timestamp = t;
    console.log(eido_timestamp)
});

document.addEventListener('DOMContentLoaded', function () {
  if (!Notification) {
    alert('Desktop notifications not available in your browser. Try Chromium.'); 
    return;
  }

  if (Notification.permission !== "granted")
    Notification.requestPermission();
});

var eidolon_sound = new Audio('eidolon.mp3');
var door_sound = new Audio('door.ogg');
// eidolon_sound.play()
var has_played_night = false;
var has_played_day = false;
var first_run = true;

function notify(string) {
  if (Notification.permission !== "granted")
    Notification.requestPermission();
  else {
    var notification = new Notification('The Eidoclock', {
      icon: '',
      body: string
    });
  }
}
function pad(s) {
	if (s.toString().length == 1) return '0' + s.toString();
	return s.toString();
}

// Credit to Wampa842 for this

// The first parameter defines whether the function should fetch the timestamp.
// If it's false or undefined, the function won't fetch anything - it'll instead use a static timestamp.
// On success, the time is passed to the callback function. On any error, the callback will receive the static timestamp and a warning is logged.
function getCetusTime(fetch, callback)
{
	var timestamp = 1522764301;	//Static timestamp to be returned in case of an error. Correct as of 2018-04-03, for PC version 22.17.0.1. Might not be accurate in the future.
	if(!fetch)
	{
		callback(timestamp);
		return;
	}

	var worldStateFileUrl = "http://content.warframe.com/dynamic/worldState.php";

	var worldStateCORSUrl = "https://whatever-origin.herokuapp.com/get?callback=?&url=" + encodeURIComponent(worldStateFileUrl);

	$.ajax(
	{
		url: worldStateCORSUrl,
		dataType: "json",
		mimeType: "application/json",
		success: function(data)
		{
			var worldStateData;
			try
			{
				worldStateData = JSON.parse(data.contents); //The data is returned as a string inside a JSON response and has to be parsed.
			}
			catch(e)
			{
				console.warn("Could not fetch Cetus time (", e.message, "). Using static timestamp. Accuracy not guaranteed.");
				callback(timestamp);
				return;
			}
			var syndicate = worldStateData["SyndicateMissions"].find(element => (element["Tag"] == "CetusSyndicate"));
			timestamp = Math.floor(syndicate["Activation"]["$date"]["$numberLong"] / 1000);	//The activation time, converted to whole seconds
			console.log("Fetched Cetus time: ", timestamp);
			callback(timestamp);
		},
		failure: function(xhr, status, error)
		{
			console.warn("Cound not fetch Cetus time:", status, error, ". Using static timestamp. Accuracy not guaranteed.");
			callback(timestamp);
		}
	});
}

function updateTime() {
	nice_background = $('#background').is(':checked');
	simple_layout = $('#simple').is(':checked');
	if (simple_layout) {
		$('.until-container').css('opacity', 1);
	} else {
		$('.until-container').css('opacity', 0);
	}
    var d = new Date();
    var time = d.getTime() / 1000;
    // This time is the end of night and start of day
    var start_time = (eido_timestamp - 150 * 60)
    var irltime_m = ((time - start_time)/60) % 150;  // 100m of day + 50m of night
    
    var eidotime_in_h = (irltime_m / 6.25) + 6;
    if (eidotime_in_h < 0) eidotime_in_h += 24;
    if (eidotime_in_h > 24) eidotime_in_h -= 24;
    var eidotime_h = Math.floor(eidotime_in_h);
    var eidotime_m = Math.floor((eidotime_in_h * 60) % 60);
    var eidotime_s = Math.floor((eidotime_in_h * 60 * 60) % 60);

    var wrapped_time = eidotime_in_h - 5;
    if (wrapped_time < 0) wrapped_time += 24;
    var slider_percent = wrapped_time / 24 * 90 + 5
    $('.slider').css('top', slider_percent + '%');

    var next_interval;

    // Night is from 9pm to 5am
    // Day is from 5am to 9pm
    if (150 - irltime_m > 50) {
        if (!has_played_day) {
            has_played_night = false;
            has_played_day = true;
            if (first_run) {
                first_run = false;
            } else {
                notify("It is day!");
            }
        }
        // Time is day
        if (nice_background) {
            $('body').css('background', "url(day_blur.jpg) no-repeat center center fixed");
        } else {
            $('body').css('background-image', "none");
            $('body').css('background-color', "black");
        }
        $('.day').addClass('night').removeClass('day');
        $('.night').text('night');
        next_interval = 21;
    } else {
        // Time is night
        if (!has_played_night) {
            has_played_night = true;
            has_played_day = false;
            if (first_run) {
                first_run = false;
            } else {
                notify("It is night!");
                eidolon_sound.play();
            }
        }
        if (nice_background) {
            $('body').css('background', "url(night_blur.jpg) no-repeat center center fixed");
        } else {
            $('body').css('background', "black");
            $('body').css('color', "white");
        }
        $('.night').addClass('day').removeClass('night');
        $('.day').text('day');
        next_interval = 5;
    }
    $('body').css('background-size', "cover");

    if (eidotime_h == 22) has_notified = false;
    var eido_until_h = next_interval - (eidotime_h % 24);
    if (eido_until_h < 0) eido_until_h += 24
    var eido_until_m = 60 - eidotime_m;
    var eido_until_s = 60 - eidotime_s;

    var irl_until_in_h = ((eido_until_h + eido_until_m / 60 + eido_until_s / 60 / 60) * 6.25) / 60;

    var irl_until_in_m = 150 - irltime_m;

    if (irl_until_in_m > 50) irl_until_in_m -= 50 

    var irl_until_h = Math.floor(irl_until_in_m / 60);
    var irl_until_m = Math.floor(irl_until_in_m % 60);
    var irl_until_s = Math.floor((irl_until_in_m * 60) % 60);

    // var irl_until_h = Math.floor(irl_until_in_h);
    // var irl_until_m = Math.floor((irl_until_in_h * 60) % 60);
    // var irl_until_s = Math.floor((irl_until_in_h * 60 * 60) % 60);
    
    $('.time>.big-hour').text(pad(irl_until_h));
    $('.time>.big-minute').text(pad(irl_until_m));
    $('.time>.big-second').text(pad(irl_until_s));

    $('.eidolon .hour').text(pad(eidotime_h));
    $('.eidolon .minute').text(pad(eidotime_m));
    $('.eidolon .second').text(pad(eidotime_s));

    $('.irl .hour').text(pad(eido_until_h));
    $('.irl .minute').text(pad(eido_until_m));
    $('.irl .second').text(pad(eido_until_s));

    // $('.time>.ampm').text(((eidotime_in_h >= 12) ? ' pm' : ' am'));
}

function alarmToHtml(alarm)
{
    var remaining = 90;
    var label = alarm.time + " minutes ";
    switch(alarm.relative)
    {
        case 0:
            label += "before sunset";
            break;
        case 1:
            label += "before sunrise";
            break;
        case 2:
            label += "after sunset";
            break;
        case 3:
            label += "after sunrise";
            break;
    }
    if(!alarm.repeat)
        label += " (once)";

    var content = [];
    content.push('<div class="alarm-list-item" id="' + alarm.id + '">');
    content.push('<div class="alarm-list-remaining">' + Math.floor(remaining / 60) + ':' + remaining % 60 + '</div>');
    content.push('<div class="alarm-list-details">');
    content.push('<h3>' + alarm.name + '</h3>');
    content.push('<span class="alarm-list-label">' + label + '</span>');
    content.push('</div>');
    content.push('<div class="alarm-list-options">');
    content.push('<button class="alarm-list-button alarm-edit" value="' + alarm.id + '">Edit</button>');
    content.push('<button class="alarm-list-button alarm-disable" value="' + alarm.id + '">Disable</button>');
    content.push('<button class="alarm-list-button alarm-delete" value="' + alarm.id + '">Delete</button>');
    content.push('</div>');
    content.push('</div>');

    return content.join('');
}

function getAlarm()
{
    var out = 
    {
        id: "",
        name: "",
        time: 0,
        relative: 0,
        repeat: false,
        notify: false
    };

    out.id = $('#alarm-form-name').val().replace(' ', '_').toLowerCase();
    out.name = $('#alarm-form-name').val();
    out.time = Number($('#alarm-form-minutes').val()) % 150;
    out.relative = Number($('#alarm-form-relative-to').val());
    out.repeat = $('#alarm-form-repeating').is(':checked');
    out.notify = $('#alarm-form-notify').is(':checked');
    return out;
}

function putAlarm(alarm)
{
    $('#new-alarm').trigger('click');
    $('#alarm-form-name').val(alarm.name);
    $('#alarm-form-minutes').val(alarm.time);
    $('#alarm-form-repeat').prop('checked', alarm.repeat);
    $('#alarm-form-notify').prop('checked', alarm.notify);
    $('#alarm-form-relative-to').val(alarm.relative);
}

function saveAlarms()
{
    if(!alarms)
        alarms = [];
    localStorage.setItem('eidoclock-alarms', JSON.stringify(alarms));
}

function deleteAlarm(id)
{
    for(var i = 0; i < alarms.length; ++i)
    {
        if(alarms[i].id == id)
        {
            alarms.splice(i, 1);
        }
    }
    saveAlarms();
}

function listAlarms()
{
    alarms = JSON.parse(localStorage.getItem('eidoclock-alarms'));
    if(!alarms || alarms.length <= 0)
    {
        alarms = [];
        $('.alarm-list').html('<p>You have no alarms</p>');
        return;
    }
    $('#alarm-button-number').text(alarms.length);

    var div = $('.alarm-list');
    div.empty();
    alarms.forEach(function(a)
    {
        div.append(alarmToHtml(a));

        $('#' + a.id + ' .alarm-edit').click(function(event)
        {
            putAlarm(alarms.find(e => e.id == a.id));
            $('#alarm-form-submit').hide();
            $('#alarm-form-update').show();
            $('#alarm-form-update').val(a.id);
        });
        $('#' + a.id + ' .alarm-disable').click(function(event)
        {

        });
        $('#' + a.id + ' .alarm-delete').click(function(event)
        {
            deleteAlarm(a.id);
            listAlarms();
        });

        a[alert] = function()
        {
            if(this.notify)
            {
                notify("Alarm:\n" + this.name);
            }
        };
    });
}

var ex = 
{
    id: "my_alarm",
    name: "My alarm",
    time: 5,
    relative: 0,
    repeat: true,
    notify: true
};

//event handlers
$(document).ready(function(event)
{
    listAlarms();

// TEST
    $('#testbutton').click(function(event)
    {
        localStorage.setItem('eidoclock-alarms', '[{"id":"alarm_1","name":"alarm 1","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_2","name":"alarm 2","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_3","name":"alarm 3","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_4","name":"alarm 4","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_5","name":"alarm 5","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_6","name":"alarm 6","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_7","name":"alarm 7","time":5,"relative":0,"repeat":true,"notify":true},{"id":"alarm_8","name":"alarm 8","time":5,"relative":0,"repeat":true,"notify":true}]');
        listAlarms();
    });

// Show alarms
    $('#alarm-button').click(function(event)
    {
        $('.modal-background').show();
    });

// Close
    $('#close-modal').click(function(event)
    {
        $('.modal-background').hide();
    });

// Add new alarm...
    $('#new-alarm').click(function(event)
    {
        $('.alarm-form-body').show();
        $('#new-alarm').hide();
        $('#new-alarm-cancel').show();
        $('#alarm-form-minutes').val(5);
        $('#alarm-form-name').val('');
        $('#alarm-form-relative-to').val(0);
        $('#alarm-form-repeating').prop('checked', true);
        $('#alarm-form-notify').prop('checked', true);
        $('#alarm-form-submit').show();
        $('#alarm-form-update').hide();
        $('#alarm-form-name').focus();
    });

// Cancel
    $('#new-alarm-cancel').click(function(event)
    {
        $('.alarm-form-body').hide();
        $('#new-alarm').show();
        $('#new-alarm-cancel').hide();
        $('#alarm-form-submit').show();
        $('#alarm-form-update').hide();
        $('#alarm-form-update').val('');
    });

// Ok
    $('#alarm-form-submit').click(function(event)
    {
        if($('#alarm-form-name').val() && $('#alarm-form-minutes').val() && Number($('#alarm-form-minutes').val()) >= 0)
        {
            event.preventDefault();
            var a = getAlarm();
            if(alarms.some(element => element.id == a.id))
                alert("An alarm with that name already exists. Please give it a different name.");
            else
            {
                alarms.push(a);
                saveAlarms();
                listAlarms();
                $('#new-alarm-cancel').trigger('click');
            }
        }
    });

// Update
    $('#alarm-form-update').click(function(event)
    {
        if($('#alarm-form-name').val() && $('#alarm-form-minutes').val() && Number($('#alarm-form-minutes').val()) >= 0)
        {
            event.preventDefault();
            var a = getAlarm();
            var index = alarms.indexOf(alarms.find(element => element.id == $('#alarm-form-update').val()));
            if(index >= 0)
            {
                alarms.splice(index, 1, a);
                saveAlarms();
                listAlarms();
                $('#new-alarm-cancel').trigger('click');
            }
            else
            {
                alarms.push(a);
                saveAlarms();
                listAlarms();
                $('#new-alarm-cancel').trigger('click');
            }
            $('#alarm-form-submit').show();
            $('#alarm-form-update').hide();
            $('#alarm-form-update').val('');
        }
    });
});

var interval = setInterval(updateTime, 1);
