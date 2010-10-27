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
    $("input[name='url_suffix']")
        .val(randomString(6))
        .focus().select();
});

