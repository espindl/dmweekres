﻿var targetNodes      = $(".profile_gradient");
var MutationObserver = window.MutationObserver || window.WebKitMutationObserver;
var myObserver       = new MutationObserver (mutationHandler);
var obsConfig        = { childList: true, characterData: true, attributes: true, subtree: false, attributeOldValue: true  };

var currentWeek = 0;
var slideCount = 1;
var scrolled = false;
var loaded = false;
var direction = "previous";
var activities = {"Running" : 0, "Cycling" : 0, "Swimming" : 0, "Spinning" : 0, "Other" : 0};

$('#previous_training').on('mousedown',function(event){
  direction = "previous";
});

$('#next_training').on('mousedown',function(event){
  direction = "next"; 
});

targetNodes.each(function (){
  if(isRightPage()){
    myObserver.observe (this, obsConfig);
  }
});

function mutationHandler (mutationRecords) {
  mutationRecords.forEach(function (mutation){
    if(mutation.oldValue=="profile_gradient loading"){
      loaded = true;
    }
    if(mutation.oldValue=="profile_gradient scrolling"){
      scrolled = true;
      if(slideCount-1==currentWeek && direction=="next"){
        scrolled = false;
      }
      handleMutations();
    }
  });
}

function handleMutations(){
  if(loaded){
    currentWeek = currentWeek+4;
    slideCount = slideCount+4;
  }
  if(scrolled){
    if(direction=="previous"){
      currentWeek = currentWeek-1;
    }else{
      currentWeek = currentWeek+1;
    }
  }
  scrolled = false;
  loaded = false;
  doTheJob();
}

if(isRightPage()){
  doTheJob();
}

function doTheJob(){
  var option;
  chrome.storage.sync.get("dmwres_option", 
    function(val) {
      option = val.dmwres_option;
      if(option=="distanceAndTime"){
        readFromApi();
      }
      else{
        addWeekDetailBar(currentWeek);
      }
    }
  );
}

function isRightPage(){
  if($(".profile_gradient").length > 0){
    return true;
  }
  return false;
}

function addWeekDetailBar(index){
  $('.aaa').remove();
  clearActivities();
  $($('.slide')[index]).find('#training_bars').children('li.active').each(function(index){
    $(this).find('#mileage_breakdown').each(function(index){
      $(this).find('.activity_name').each(function(index){
          var activityName = $(this).text();
          $(this).nextUntil('dt').each(function(index){
            var bdMiles = $(this).find('.breakdown_miles');
            if(bdMiles.length!=0){
              var mile = parseFloat(bdMiles.text());
            }
            else{
              var mile = parseFloat($(this).find('span.bold').text());
            }
            if(activities[activityName] != null){
              activities[activityName] = activities[activityName] + mile;
            }
            else{
              activities["Other"] = activities["Other"] + mile;
            }
        });
      });
    });
  });
  var newUl = 
  '<ul id=\'profile_stats\' class=\'training_details light_grey_bezel aaa\'><li class=\'miles_stat first\'><strong class=\'stat\'>'+
  printActivity("Running")+'</strong><span class=\'label\'> running</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  printActivity("Cycling")+'</strong><span class=\'label\'> cycling</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  printActivity("Swimming")+'</strong><span class=\'label\'> swimming</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  printActivity("Spinning")+'</strong><span class=\'label\'> spinning</span></li><li class=\'miles_stat first\'><strong class=\'stat\'>'+
  printActivity("Other")+'</strong><span class=\'label\'> other</span></li></ul>';
  
  $('#profile_stats').after(newUl);
}

function printActivity(name){
  if(activities[name]==0){
    return "-";
  }
  else{
    return activities[name].toFixed(2);
  }
}

function clearActivities(){
  activities["Running"] = 0;
  activities["Cycling"] = 0;
  activities["Swimming"] = 0;
  activities["Spinning"] = 0;
  activities["Other"] = 0;
}

/*********************************************************************************************/

function activity(type, count, totalDistance, totalTime){
  this.type = type;
  this.count = count;
  this.totalDistance = totalDistance;
  this.totalTime = totalTime;
 
  this.reset = function(){
    this.count = 0;
    this.totalDistance = 0;
    this.totalTime = 0;
  }
  this.printAll = function(){
    var distance = this.totalDistance == 0 ? "-" : this.totalDistance.toFixed(2);
    var time = this.totalTime == 0 ? "-" : this.totalTime.toString().toHHMMSS();
    return distance + "<br/>" + time;
  }
}

String.prototype.toHHMMSS = function () {
    sec_numb    = parseInt(this);
    var hours   = Math.floor(sec_numb / 3600);
    var minutes = Math.floor((sec_numb - (hours * 3600)) / 60);
    var seconds = sec_numb - (hours * 3600) - (minutes * 60);

    /*if (hours   < 10) {hours   = "0"+hours;}*/
    if (minutes < 10) {minutes = "0"+minutes;}
    if (seconds < 10) {seconds = "0"+seconds;}
    var time = hours + ':' + minutes;
    return time;
}

var week = {"Running": new activity("Running",0,0,0), 
            "Cycling": new activity("Cycling",0,0,0), 
            "Swimming": new activity("Swimming",0,0,0), 
            "Spinning": new activity("Spinning",0,0,0), 
            "Other": new activity("Other",0,0,0) };

function resetWeek(){
  week["Running"].reset();
  week["Cycling"].reset();
  week["Swimming"].reset();
  week["Spinning"].reset();
  week["Other"].reset();
}

function readFromApi(){
  initializeBar();
  var period = $('li.period_stat').children('strong.stat').text();
  var periodDates = null;
  if(period == 'This Week'){
    periodDates = getThisWeek();
  }
  else{
    periodDates = {first: period.replace(/\s+/g, '').substring(0,5), last: period.replace(/\s+/g, '').substring(6,11)};
  }
  var isNextYear = parseInt(periodDates.first.split('/')[0]) > parseInt(periodDates.last.split('/')[0]);
  callAPI(getUserName(),getUnixTime(periodDates.first,true,false),getUnixTime(periodDates.last,false,isNextYear));
}

function jsonToWeek(jsonObj){
  resetWeek();
  $.each(jsonObj.entries,function(){
    var wout = this.workout;
    if(wout != null){
      var type = wout.activity_type;
      if(week[type] == null){
        type = "Other";
      }
      week[type].count += 1;
      week[type].totalTime += wout.duration != null ? wout.duration : 0;
      if(wout.distance != null){
        var dist = 0;
        if(wout.distance.units == "meters"){
          dist = wout.distance.value/1000;
        }
        else if(wout.distance.units == "miles"){
          dist = wout.distance.value*1.61;
        }
        else{
          dist = wout.distance.value;
        }
        week[type].totalDistance += dist;
      }
    }
  });
  
  $('.bbb').remove();
  var newStats = 
  '<ul id=\'profile_stats\' class=\'training_details light_grey_bezel bbb\'><li class=\'miles_stat first\'><strong class=\'stat\'>'+
  week["Running"].printAll() +'</strong><span class=\'label\'> running</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  week["Cycling"].printAll() +'</strong><span class=\'label\'> cycling</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  week["Swimming"].printAll() +'</strong><span class=\'label\'> swimming</span></li><li class=\'miles_stat\'><strong class=\'stat\'>'+
  week["Spinning"].printAll() +'</strong><span class=\'label\'> spinning</span></li><li class=\'miles_stat first\'><strong class=\'stat\'>'+
  week["Other"].printAll() +'</strong><span class=\'label\'> other</span></li></ul>';
  $('#profile_stats').after(newStats);
}

function initializeBar(){
  $('.bbb').remove();
  var newStats = 
  '<ul id=\'profile_stats\' class=\'training_details light_grey_bezel bbb\'><li class=\'miles_stat first\'><strong class=\'stat\'><img src="'+chrome.extension.getURL("images/spinner.gif")+'"/></strong><span class=\'label\'> running</span></li><li class=\'miles_stat\'><strong class=\'stat\'><img src="'+chrome.extension.getURL("images/spinner.gif")+'"/></strong><span class=\'label\'> cycling</span></li><li class=\'miles_stat\'><strong class=\'stat\'><img src="'+chrome.extension.getURL("images/spinner.gif")+'"/></strong><span class=\'label\'> swimming</span></li><li class=\'miles_stat\'><strong class=\'stat\'><img src="'+chrome.extension.getURL("images/spinner.gif")+'"/></strong><span class=\'label\'> spinning</span></li><li class=\'miles_stat first\'><strong class=\'stat\'><img src="'+chrome.extension.getURL("images/spinner.gif")+'"/></strong><span class=\'label\'> other</span></li></ul>';
  $('#profile_stats').after(newStats);
}

function callAPI(user, since, until){
  var xhr = new XMLHttpRequest();
  xhr.onload = function() {
      var json = xhr.responseText;                         // Response
      json = json.replace(/^[^(]*\(([\S\s]+)\);?$/, '$1'); // Turn JSONP in JSON
      json = JSON.parse(json);                             // Parse JSON
      jsonToWeek(json);
  };
  xhr.open('GET', 'http://api.dailymile.com/people/'+user+'/entries.json?since='+since+'&until='+until);
  xhr.send();
}
  
//girdi biçimi: 11/26
function getUnixTime(yourDate, isDayStart, isNextYear) {
    var currentTime = new Date();
    var year = currentTime.getFullYear();
    if(isNextYear){
      year = year + 1;}
    if(isDayStart){
      return new Date(year,parseInt(yourDate.split('/')[0],10)-1,parseInt(yourDate.split('/')[1],10),0,0,1).getTime()/1000;}
    else{
      return new Date(year,parseInt(yourDate.split('/')[0],10)-1,parseInt(yourDate.split('/')[1],10),23,59,59).getTime()/1000;}
}

function getThisWeek(){
  var curr = new Date();
  var dayOfWeek = curr.getDay()==0?7:curr.getDay();
  var first = curr.getDate() - dayOfWeek + 1;
  var firstDate = new Date(curr.getFullYear(),curr.getMonth(),first);
  var lastDate = new Date(firstDate);
  lastDate.setDate(lastDate.getDate() + 6);

  console.log(firstDate.getMonth()+1 + '/' + firstDate.getDate() + '----' + lastDate.getMonth()+1 + '/' + lastDate.getDate())
  return {first: firstDate.getMonth()+1 + '/' + firstDate.getDate(), last: lastDate.getMonth()+1 + '/' + lastDate.getDate()};
}

function getUserName(){
  var profileUrl = $('h1.mainHeader').children('a.url').attr('href');
  return profileUrl.split('/')[2];
}
