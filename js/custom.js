function updateCountryNumberCount() {
  const $numbersDisplay = $('#numbers-display');
  const $countryNumCount = $('#custom__country-num-count');

  const numberTagCount = $numbersDisplay.find('.number-tag').length;

  $countryNumCount.text(numberTagCount);

  if (numberTagCount === 0 && $("#uploaded-csv").is(":visible")) {
    $("#uploaded-csv").prop("hidden", true).text("")
  }

  console.log(`Total number tags found: ${numberTagCount}`);
}

$(document).ready(function () {
  $("#numbers-input").on("blur keydown keyup", updateCountryNumberCount)
  // $("#delete-all-numbers").on("click", function () {
  //   $('.custom__country-num-count-container').css('display', 'none');
  //   $('#custom__country-num-count').text('0')
  // })
})