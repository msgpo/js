var BoardsController = Composer.Controller.extend({
	elements: {
		'.board-list': 'board_list',
		'.dropdown': 'dropdown',
		'.dropdown .header': 'header',
		'.dropdown .add-board': 'add_container',
		'.dropdown .boards-sub': 'boards_sub',
		'input[name=filter]': 'inp_filter'
	},

	events: {
		'click a.main': 'open_boards',
		'click .button.add': 'add_board',
		'keyup input[name=filter]': 'filter_boards',
		'click .dropdown a[href=#add-persona]': 'open_personas',
	},

	profile: null,
	collection: null,
	filter_text: null,

	list_controller: null,
	add_controller: null,

	show_actions: true,

	init: function()
	{
		this.render();
		turtl.keyboard.bind('b', this.open_boards.bind(this), 'boards:shortcut:add_board');
	},

	release: function()
	{
		this.unbind('change-board');
		if(this.add_controller) this.add_controller.release();
		turtl.keyboard.unbind('b', 'boards:shortcut:add_board');
		this.parent.apply(this, arguments);
	},

	render: function()
	{
		var current	=	this.profile.get_current_board();
		var is_open	=	this.dropdown && this.dropdown.hasClass('open');
		var content	=	Template.render('boards/index', {
			num_boards: this.profile.get('boards').models().length,
			current: current ? toJSON(current) : null,
			num_personas: turtl.user.get('personas').models().length,
			is_open: is_open
		});
		this.html(content);

		// set up our listing sub-controller
		if(this.list_controller) this.list_controller.release();
		this.list_controller	=	new BoardListController({
			inject: this.boards_sub,
			profile: this.profile,
			show_actions: this.show_actions
		});
		this.list_controller.bind('close-boards', this.close_boards.bind(this));
		this.list_controller.bind('change-board', function() {
			this.trigger('change-board');
		}.bind(this));

		if(this.dropdown) this.dropdown.monitorOutsideClick(function() {
			this.close_boards();
		}.bind(this));

		if(this.add_container)
		{
			this.add_container.set('slide', {duration: 'short'});
			this.add_container.get('slide').hide();
		}
	},

	open_boards: function(e)
	{
		if(e) e.stop();
		if(this.dropdown.hasClass('open'))
		{
			this.close_boards();
		}
		else
		{
			turtl.keyboard.detach();
			this.dropdown.addClass('open');
			this.board_list.addClass('open');
			var focus	=	function () { this.inp_filter.focus(); }.bind(this);
			focus();
			focus.delay(10, this);
			this.dropdown.setStyle('height', '');
			(function() { 
				var dcoord	=	this.dropdown.getCoordinates();
				var wcoord	=	window.getCoordinates();
				var wscroll	=	window.getScroll().y;
				var height	=	dcoord.height - ((dcoord.bottom - (wcoord.bottom + wscroll)) + 50);
				if(dcoord.bottom > wcoord.bottom)
				{
					this.dropdown.setStyles({ height: height });
				}
			}).delay(0, this);
		}
	},

	close_boards: function(e)
	{
		turtl.keyboard.attach();
		if(this.add_controller) this.add_controller.release();
		this.dropdown.removeClass('open');
		this.dropdown.setStyle('height', '');
		this.board_list.removeClass('open');
	},

	add_board: function(e)
	{
		if(modal.is_open) return false;
		if(e) e.stop();

		var parent	=	this.el.getParent();
		if(this.add_controller)
		{
			this.add_controller.inp_title.focus();
			return false;
		}
		this.add_controller	=	new BoardEditController({
			profile: this.profile,
			inject: this.add_container,
			bare: true
		});

		(function() {
			this.add_container.slide('in');
		}).delay(10, this);

		this.add_controller.bind('release', function() {
			this.add_controller.unbind('release', 'board:edit:release');
			this.add_controller	=	null;
			this.add_container.slide('out');
		}.bind(this), 'board:edit:release');
	},

	filter_boards: function(e)
	{
		if(!this.list_controller) return false;

		if(e.key == 'esc')
		{
			this.list_controller.filter(null);
			this.inp_filter.value	=	'';
			return false;
		}

		if(e.key == 'enter')
		{
			this.list_controller.select_first_board();
			this.list_controller.filter(null);
			this.inp_filter.value	=	'';
			return;
		}

		var txt	=	this.inp_filter.value;
		this.list_controller.filter(txt);
	},

	open_personas: function(e)
	{
		if(e) e.stop();
		this.close_boards();
		new PersonaEditController();
	}
});

