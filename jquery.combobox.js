/// <reference path="~/Scripts/jquery-vsdoc.js" />

(function($){
	$.fn.combobox = function(options)
	{
		var settings =
		{
			"autocomplete": false, // not implemented
			"combobox": true,
			"data": [],
			"url": null,
			"delay": 200,
			"onAjaxSuccess": function(){},
			"onChange": function(){},
			"params": {},
			"limit": 100,
			"ajaxIndicator": "/Content/img/ajax-loader-rectangle-small.gif",
			"showClearButton": false,
			"selectBoxMode": false,
			"useMidStringSearch": false
		};
		
		if (options)
			$.extend(settings, options);

		if (settings.autocomplete)
			alert("autocomplete is not implemented yet");
		
		// precache images
		if (settings.ajaxIndicator.length > 0)
		{
			var img = $("<img/>");
			img.attr("src", settings.ajaxIndicator).hide();
			
			$("body").append(img);
		}
		
		var keys =
		{
			"BACKSPACE": 8,
			"TAB": 9,
			"ENTER": 13,
			"ESC": 27,
			"SPACE": 32,
			"PAGE_UP": 33,
			"PAGE_DOWN": 34,
			"END": 35,
			"HOME": 36,
			"LEFT": 37,
			"UP": 38,
			"RIGHT": 39,
			"DOWN": 40,
			"F1": 112,
			"F2": 113,
			"F3": 114,
			"F4": 115,
			"F5": 116,
			"F6": 117,
			"F7": 118,
			"F8": 119,
			"F9": 120,
			"F10": 121,
			"F11": 122,
			"F12": 123
		};

		var $this = this;
		$this.attr("autocomplete", "off")
			.addClass("cfcombobox");
		
		var lastKeyUp = new Date("1/1/2000");
		var cache = [];
		var listId = $this.attr("id") + "combobox";
		var highlightIndex = -1;

		if (settings.combobox)
		{
			$this.parent().css("white-space", "nowrap");
			
			var arrow = $("<span/>")
				.attr("id", listId + "arrow")
				.addClass("cfcombobox")
				.addClass("arrow")
				.click
				(
					function(event)
					{
						$("div.cfcombobox:not([id=" +listId + "])").empty().remove();
						$this.focus();
						
						if (getMenu().length > 0)
							hideMenu();
						else if (settings.selectBoxMode)
						{
							$this.select();
							findMatches("", 0);
						}
						else
							findMatches($this.val(), 0);

						return false;
					}
				);
			
			$this.after(arrow);

			if (settings.showClearButton)
			{
				var clear = $("<span/>")
					.attr("id", listId + "clear")
					.addClass("cfcombobox")
					.addClass("clear")
					.click
					(
						function(event)
						{
							$this.val("");
							hideMenu();

							return false;
						}
					);
				
				arrow.after(clear);
			}
		}

		var getMenu = function()
		{
			return $("#" + listId);
		};
		
		var hideMenu = function()
		{
			$("div.cfcombobox").empty().remove();

			if (settings.selectBoxMode)
				autoSelectLastValidItem();
		};
		
		var OnWindowClick = function(event)
		{
			hideMenu();
		};
		
		$(window).click(OnWindowClick);
		
		var moveHighlight = function(operation)
		{
			var menu = getMenu();
			if (menu.length === 0)
				return;
			
			var items = menu.find("li");
			
			if (items.length === 0)
				return;
				
			var itemHeight = $(items[0]).innerHeight();
			var menuHeight = menu.height();
			var visibleCount = Math.floor(menuHeight / itemHeight);

			switch (operation)
			{
				case keys.UP:
					if (highlightIndex <= 0 || highlightIndex > items.length - 1)
						highlightIndex = items.length - 1;
					else
						highlightIndex--;
					
					break;
				case keys.DOWN:
					if (highlightIndex < 0 || highlightIndex >= items.length - 1)
						highlightIndex = 0;
					else
						highlightIndex++;
					
					break;
				case keys.PAGE_UP:
					if (highlightIndex <= 0 || highlightIndex - visibleCount > items.length - 1)
						highlightIndex = items.length - 1;
					else
						highlightIndex -= visibleCount - 2;
					
					break;
				case keys.PAGE_DOWN:
					if (highlightIndex < 0 || highlightIndex + visibleCount >= items.length - 1)
						highlightIndex = 0;
					else
						highlightIndex += visibleCount - 2;
					
					break;
				case keys.HOME:
					highlightIndex = 0;
					break;
				case keys.END:
					highlightIndex = items.length - 1;
					break;
			}
			
			highlightCurrent();
		};
		
		var getJSON = function(query, start, callback)
		{
			if (!callback)
				callback = function(){};
				
			var params =
			{
				"q": query,
				"start": start,
				"limit": settings.limit,
				"timestamp": +new Date()
			};
			
			params = $.extend(params, settings.params);
			
			$this.css("background-image", "url(" + settings.ajaxIndicator + ")")
				.css("background-position", "right center")
				.css("background-repeat", "no-repeat");
			
			$.getJSON
			(
				settings.url,
				params,
				function(data)
				{
					if (!cache[query])
					{
						cache[query] =
						{
							"results": [],
							"total": 0
						}
					}
					
					cache[query].total = data.total;
					
					for (var i = start; i < data.results.length + start; i++)
						cache[query].results[i] = data.results[i - start];
					
					if (query === "" && cache[query].results.length == cache[query].total)
						settings.data = cache[query].results;
						
					callback();
					if (settings.onAjaxSuccess)
						settings.onAjaxSuccess();

					$this.css("background-image", "")
				}
			);
		};

		var ensureItemIsVisible = function()
		{
			var menu = getMenu();
			var ul = menu.find("ul");
			var menuHeight = ul.innerHeight();
			var menuTop = ul.scrollTop();
			var menuBottom = menuHeight + menuTop;
			
			if (highlightIndex < 0)
				return;
			
			var item = $(menu.find("li").get(highlightIndex));
			var itemHeight = item.innerHeight();
			var itemTop = item.position().top + menuTop;
			var itemBottom = itemTop + itemHeight;
			
			if (itemTop >= menuTop && itemBottom <= menuBottom)
				return;
			
			if (itemBottom > menuBottom)
				ul.scrollTo(itemBottom - menuHeight);
			else if (itemTop < menuTop)
				ul.scrollTo(itemTop);
		};
		
		var highlightCurrent = function()
		{
			var menu = getMenu();
			var items = menu.find("li");
			items.removeClass("highlighted");

			if (highlightIndex == -1)
				return;
			
			var item = $(menu.find("li").get(highlightIndex));
			item.addClass("highlighted")
			
			if (settings.autocomplete)
			{
				var originalText = $this.val();
				$this.val(item.text());
				
				var userSelection;
				if (window.getSelection)
					userSelection = window.getSelection();
				else if (document.selection)
					userSelection = document.selection.createRange();

				var range;
				if (selectionObject.getRangeAt)
					range = selectionObject.getRangeAt(0);
				else
				{
					range = document.createRange();
					range.setStart(selectionObject.anchorNode,selectionObject.anchorOffset);
					range.setEnd(selectionObject.focusNode,selectionObject.focusOffset);
				}

				range.setStart($this[0], originalText.length);
				range.setEnd($this[0], $this.val().length);
			}
			
			ensureItemIsVisible();
		};
		
		var selectItem = function(item)
		{
			if (!item.is("li"))
				return;
			
			var isChanged = $this.data("value") != item.data("value");
			$this.val(item.text());
			$this.data("value", item.data("value"));
			$this.data("lastSelection", item.clone(true));
			
			$this.focus();
			hideMenu();
			
			if (isChanged)
				settings.onChange($this, item);
		};
		
		var autoSelectLastValidItem = function()
		{
			var item = $this.data("lastSelection");
			if (!item.is("li"))
				return;
			
			$this.val(item.text());
			$this.data("value", item.data("value"));
			$this.data("lastSelection", item);
		}
		
		var autoSelectInitialItem = function()
		{
			if (!settings.selectBoxMode || settings.data.length === 0)
				return;
				
			var selectedIndex = 0;
			for (var i = 0; i < settings.data.length; i++)
			{
				if (!settings.data[i].Selected)
					continue;
				
				selectedIndex = i;
				break;
			}
			
			var item = settings.data[selectedIndex];
			var li = $("<li/>");
			li.text(item.Text);
			li.data("value", item.Value === null ? item.Text : item.Value);

			$this.val(li.text());
			$this.data("value", li.data("value"));
			$this.data("lastSelection", li);
		};
		
		var registerHandlers = function(list)
		{
			var items = list.find("li");
			items.mouseover
			(
				function()
				{
					highlightIndex = $(this).prevAll().length;
					highlightCurrent();
				}
			).click
			(
				function()
				{
					if (!$(this).hasClass("showMore"))
						selectItem($(this));
				}
			);
		};
		
		var render = function(list)
		{
			if (list.find("li").length === 0)
			{
				hideMenu();
				return;
			}
			
			var w = $this.innerWidth();
			if (settings.combobox)
				w += parseInt($("span.cfcombobox.arrow").innerWidth(), 10);
			
			var re = /^(\d+)/;
			var margin =
			{
				"top": re.exec($this.css("margin-top")) === null ? 0 : parseInt(re.exec($this.css("margin-top")), 10),
				"right": re.exec($this.css("margin-right")) === null ? 0 : parseInt(re.exec($this.css("margin-right")), 10),
				"bottom": re.exec($this.css("margin-bottom")) === null ? 0 : parseInt(re.exec($this.css("margin-bottom")), 10),
				"left": re.exec($this.css("margin-left")) === null ? 0 : parseInt(re.exec($this.css("margin-left")), 10)
			};
			
			var borderWidth =
			{
				"top": re.exec($this.css("border-top-width")) === null ? 0 : parseInt(re.exec($this.css("border-top-width")), 10),
				"right": re.exec($this.css("border-right-width")) === null ? 0 : parseInt(re.exec($this.css("border-right-width")), 10),
				"bottom": re.exec($this.css("border-bottom-width")) === null ? 0 : parseInt(re.exec($this.css("border-bottom-width")), 10),
				"left": re.exec($this.css("border-left-width")) === null ? 0 : parseInt(re.exec($this.css("border-left-width")), 10)
			};
			
			list.css("position", "absolute")
				.css("list-style-type", "none")
				.css("left", $this.offset().left + "px")
				.css("top", $this.offset().top + $this.innerHeight() + margin.top + margin.bottom + borderWidth.top + borderWidth.bottom + "px")
				.css("width", w + "px");
				
			registerHandlers(list);
		};
		
		var showMore = function()
		{
			var query = $this.val();
			var remaining = cache[query].total - cache[query].results.length;
			var start = cache[query].total - remaining;
			
			findMatches(query, start);
		};
		
		var displayResults = function(query)
		{
			if (!cache[query])
				return;
				
			var menu = getMenu();
			if (menu.length === 0)
				menu = $("<div/>").attr("id", listId).addClass("cfcombobox").append("<ul/>");
			
			var ul = menu.find("ul");
			ul.empty();
			
			var body = $("body");
			body.append(menu);

			var item;
			for (var i = 0; i < cache[query].results.length; i++)
			{
				item = $("<li/>")
					.text(cache[query].results[i].Text)
					.attr("title", cache[query].results[i].Text);
				
				if (cache[query].results[i].Value !== null)
					item.data("value", cache[query].results[i].Value);
				else
					item.data("value", cache[query].results[i].Text);
				
				ul.append(item);
			}
			
			var remaining = cache[query].total - cache[query].results.length;
			if (remaining > 0)
			{
				var start = cache[query].total - remaining;
				var text = "<" + remaining + " more results>";
				item = $("<li/>")
					.text(text)
					.attr("title", text)
					.addClass("showMore")
					.click
					(
						function(event)
						{
							showMore();
							return false;
						}
					);
				ul.append(item);
			}
			
			render(menu);
			highlightCurrent();
		};
		
		var findMatches = function(query, start)
		{
			var useJSON = false;
			
			if (cache[query])
			{
				if (cache[query].results.length == cache[query].total)
					displayResults(query);
				else if (start <= cache[query].results.length - settings.limit)
					displayResults(query);
				else if (settings.url !== null)
					useJSON = true;
			}
			else if (settings.data.length > 0)
			{
			  var specials = new RegExp("[.*+?|()\\[\\]{}\\\\]", "g"); // .*+?|()[]{}\
			  var safeQuery = query.replace(specials, "\\$&");
			  var re = new RegExp("^" + safeQuery, "i");
				
				if (settings.useMidStringSearch)
					re = new RegExp(safeQuery, "i");

				var matches = [];
				for (var i = 0; i < settings.data.length; i++)
				{
					if (re.test(settings.data[i].Text))
						matches.push(settings.data[i]);
				}
				
				cache[query] =
				{
					"results": matches,
					"total": matches.length
				};
				
				displayResults(query);
			}
			else if (settings.url !== null)
				useJSON = true;
			
			if (useJSON)
			{
				getJSON
				(
					query,
					start,
					function()
					{
						findMatches(query, start);
					}
				);
			}
		};
		
		var OnKeydownEnter = function(event)
		{
			if (highlightIndex == -1)
				return;
				
			var item = $(getMenu().find("li").get(highlightIndex));
			
			if (item.hasClass("showMore"))
				showMore();
			else
				selectItem(item);
				
			event.preventDefault();
			return false;
		};
		
		var OnKeydownTab = function(event)
		{
			if (getMenu().length > 0)
				return OnKeydownEnter(event);
			
			return true;
		};
		
		this.keydown
		(
			function(event)
			{
				switch (event.keyCode)
				{
					case keys.DOWN:
					case keys.UP:
					case keys.PAGE_DOWN:
					case keys.PAGE_UP:
					case keys.HOME:
					case keys.END:
						moveHighlight(event.keyCode);
						return;
					case keys.TAB:
						return OnKeydownTab(event);
					case keys.ENTER:
						return OnKeydownEnter(event);
				}
			}
		).keypress
		(
			function(event)
			{
				if (getMenu().length > 0 && event.keyCode == keys.ENTER)
				{
					event.preventDefault();
					return false;
				}
			}
		).keyup
		(
			function(event)
			{
				switch (event.keyCode)
				{
					case keys.DOWN:
					case keys.UP:
					case keys.TAB:
					case keys.F1:
					case keys.F2:
					case keys.F3:
					case keys.F4:
					case keys.F5:
					case keys.F6:
					case keys.F7:
					case keys.F8:
					case keys.F9:
					case keys.F10:
					case keys.F11:
					case keys.F12:
						return;
					case keys.ENTER:
						event.preventDefault();
						return false;
					default:
						var now = new Date();
						if (now - lastKeyUp > settings.delay)
						{
							lastKeyUp = now;
							var query = $this.val();
							findMatches(query, 0);
						}
						lastKeyUp = now;
						break;
				}
			}
		);
		
		var OnFormSubmit = function()
		{
			if (settings.selectBoxMode)
			{
				var name = $this.attr("name");
				var hidden = $("<input/>");
				hidden.attr("type", "hidden");
				hidden.attr("name", name);
				hidden.val($this.data("value"));
				
				$this.attr("name", name + "combobox");
				$this.before(hidden);
			}
		};
		
		$this.closest("form").submit(OnFormSubmit);
		
		if (settings.selectBoxMode && settings.data.length > 0)
			autoSelectInitialItem();

		$this.data("lastValue", $this.data("value"));
		
		return this;
	};
})(jQuery);
