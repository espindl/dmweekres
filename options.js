// Saves options to localStorage.
function save_options() {
  //localStorage["dmwres_option"] = $('input[name=type]:checked').val();
  //$("#status").show('slow').delay(1000).fadeOut('slow');
  chrome.storage.sync.set({'dmwres_option': $('input[name=type]:checked').val()}, function() {
    $("#status").show('slow').delay(1000).fadeOut('slow');
    $("#selectionImg").html('<img src=\"images/'+ $('input[name=type]:checked').val() + '.jpg\"/>').hide().fadeIn(800);
  });
}

// Restores saved value from localStorage.
function restore_options() {
  //var option = localStorage["dmwres_option"];
  var option;
  chrome.storage.sync.get("dmwres_option", 
    function(val) {
      option = val.dmwres_option;
      if (!option) {
        return;
      }
      $("input[name=type][value=" + option + "]").attr('checked', 'checked');
      $("#selectionImg").html('<img src=\"images/'+ option + '.jpg\"/>').hide().fadeIn(800);
    }
  );
}
document.addEventListener('DOMContentLoaded', restore_options, false);
document.addEventListener('DOMContentLoaded', function () {
  document.getElementById('save').addEventListener('click', save_options, false);
});