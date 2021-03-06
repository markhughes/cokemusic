var UI_ACTIVE = false;
var INVENTORY_ITEMS_PER_PAGE = 25;

var CATALOG_JSON_URL = "/jsonreply/catalog.php";

$(document).ready(function() {
	init_bar_ui();
	init_navigation();
	init_catalog();
	init_inventory();
	init_toggles();
	init_popups();
});

function init_bar_ui() {
	$('#navigation').click(function(){
		on_navigation_click();
	});

	$('#message').click(function(){

	});	

	$('#decibals').click(function(){

	});

	$('#backpack').click(function(){
		on_inventory_click();
	});

	$('#catalogue').click(function(){
		on_catalog_click();
	});
	
	$('#music').click(function(){

	});

	$('#help').click(function(){
		// toggle_popup('#avatar-editor');
		// $(this).toggleClass('active');
	});	
}

function clear_bar_ui() {
	
}

function init_toggles() {
	$('[data-toggle]').each(function(){
		$(this).click(function(){
			untoggle();

			$(this).addClass('selected');

			var div = '#' + $(this).data('toggle');
			$(div).show();
		});
	});

	function untoggle() {
		$('[data-toggle]').each(function(){
			$(this).removeClass('selected');
			var div = '#' + $(this).data('toggle');
			$(div).hide();
		});
	}
}

function init_popups() {
	$('.popup').each(function(){
		var popup = $(this);

		$(this).find('.close').each(function() {
			$(this).click(function() {
				toggle_popup(popup);
			});
		})
	});
}

function close_popup(obj) {
	obj.hide();
}

function show_popup(id) {
	//TODO: check if the obj exists
	$(id).show();
}

function toggle_popup(id){
	$(id).toggle();
}
