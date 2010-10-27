function randomString(string_length) {
	var chars = "abcdefghiklmnopqrstuvwxyz";
	var random_string = '';
	for (var i=0; i<string_length; i++) {
		var rnum = Math.floor(Math.random() * chars.length);
		random_string += chars.substring(rnum,rnum+1);
	}
	return random_string;
}

$(function() {
    // Select the URL
    $("input[name='url_suffix']")
        .val(randomString(6))
        .focus().select();

    // Form submission
    $(".ipad-size").click(function() {
        goBoard('ipad');
    });
    $(".iphone-size").click(function() {
        goBoard('iphone');
    });
    function goBoard(type) {
        $(".size").attr("disabled","disabled");
        var room_id = $("input[name='url_suffix']").val();

        window.location = '/create?type=' + type + '&room_id=' + room_id;
    }
});

