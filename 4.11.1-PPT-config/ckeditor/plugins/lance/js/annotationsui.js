/**
Copyright 2018 LoopIndex, This file is part of the Inline Comments plugin for CKEditor.

Written by (David *)Frenkiel - https://github.com/imdfl
**/
(function(App, $) {
	
	"use strict";

	if (! App) {
		App = window.App = {};
	}

	function defaultGetLocalizedString(key) {
		return key;
	}
	
	function setReadOnly($textarea, bReadOnly, options) {
		bReadOnly = Boolean(bReadOnly);
		if (bReadOnly) {
			$textarea.attr("readonly", "readonly");
		}
		else {
			$textarea.removeAttr("readonly");
		}
		if (options && options.containerClass) {
			var $parent = $textarea.parents('.' + options.containerClass);
			if (options.readOnlyClass) {
				$parent.toggleClass(options.readOnlyClass, bReadOnly);
			}
			if (options.readWriteClass) {
				$parent.toggleClass(options.readWriteClass, ! bReadOnly);
			}
		}
	}

	function resetTextArea($ta, taOptions) {
		$ta.val("").css("height", "");
		setReadOnly($ta, true,taOptions);
	}

	function isReadOnly($textarea) {
		return $textarea && $textarea.attr("readonly"); 
	}
	
	// constants
	var ANNOTATION_CLASS = "annotation-ui",
		ANNOTATION_CLASS_SELECTOR = '.' + ANNOTATION_CLASS,
		ANNOTATION_ATTR = "data-annotation-id",
		COMMENT_ID_ATTR = "data-comment-id",
		COMMENT_CLASS = "comment-ui",
		COMMENT_CLASS_SELECTOR = '.' + COMMENT_CLASS,
		defaultAutogrowOptions = { fitOnInit: true },
		console = window.console,
		RE_LOCALIZED_ATTRIBUTE = /\[\[([^\]]+)\]\]/,
		debugMode = false;



	/**
	 * @class
	 * The annotations ui. Displays annotations managed by an {@link App.Annotations Annotations manager}
	 * @constructor Creates an instance of the Annotations UI
	 */
	var AnnotationsUI = App.AnnotationsUI = function() {
		this._owner = null;
		this._revertTimeouts = [];
		this._deselectTimeouts = [];
		this._selectTimeouts = [];
		this._blurTimeouts = [];
		this._revertTimeouts.name = "revert timeouts";
		this._deselectTimeouts.name = "deselect timeouts";
		this._selectTimeouts.name = "select timeouts";
		this._blurTimeouts.name = "blur timeouts";
		this._updateInterval = null;
		this._isEnabled = false;
		this._getLocalizedString = defaultGetLocalizedString;
	}
	
	App.AnnotationsUI.Events = {
		/**
		 * @member App.AnnotationsUI
		 * @event ANNOTATION_UI_CREATED
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the annotationsui DOM node
		 * @param {String} id The id of the annotation
		 * @param {App.AnnotationsUI} ui the containing ui
		 */
		ANNOTATION_UI_CREATED : "annotationui:created", // annotation: annotation

		/**
		 * @member App.AnnotationsUI
		 * @event ANNOTATION_UI_REMOVED
		 * The ui of the specified annotation (thread) has been removed
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the annotationsui DOM node
		 * @param {String} id The id of the annotation
		 * @param {App.AnnotationsUI} ui the containing ui
		 */			
		ANNOTATION_UI_REMOVED: "annotationui:removed",

		/**
		 * @member App.AnnotationsUI
		 * @event ANNOTATION_UI_SELECTED
		 * An annotation node has been selected or deselected.
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the annotationsui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} id The id of the annotation
		 * @param {Boolean} isSelected the annotation id
		 */			
		ANNOTATION_UI_SELECTED: "annotationui:selected",

		/**
		 * @member App.AnnotationsUI
		 * @event ANNOTATION_UI_CHANGED
		 * An annotation node has been repopulated.
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the annotationsui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} id The id of the annotation
		 */			
		ANNOTATION_UI_CHANGED: "annotationui:changed",

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_CREATED
		 * A comment node has been created and populated.
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the commentui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} commentId The id of the comment
		 * @param {String} annotationId The id of the annotation
		 */			
		COMMENT_UI_CREATED: "commentui:created",

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_CHANGED
		 * The content of a comment node has changed.
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the commentui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} commentId The id of the comment
		 * @param {String} annotationId The id of the annotation
		 */
		COMMENT_UI_CHANGED: "commentui:changed",

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_DONE
		 * done editing a comment
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the annotationsui DOM node
		 * @param {String} id The id of the annotation
		 * @param {App.AnnotationsUI} ui the containing ui
		 */
		COMMENT_UI_DONE : "commentui:done", // annotation: annotation id

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_REMOVED
		 * a comment node has been removed.
		 * All parameters are enclosed in an Event object
		 * @param {Object} $node the commentui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} commentId The id of the comment
		 * @param {String} annotationId The id of the annotation
		 */
		COMMENT_UI_REMOVED: "commentui:removed",

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_BEFORE_COMMAND
		 * a comment node has been removed.
		 * All parameters are enclosed in an Event object
		 * @param {String} command the commentui DOM node
		 * @param {Object} $node the commentui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} commentId The id of the comment
		 * @param {String} annotationId The id of the annotation
		 * @param {Boolean} cancel set to false to prevent further command processing
		 */
		COMMENT_UI_BEFORE_COMMAND: "commentui:before-command",

		/**
		 * @member App.AnnotationsUI
		 * @event COMMENT_UI_AFTER_COMMAND
		 * a comment node has been removed.
		 * All parameters are enclosed in an Event object
		 * @param {String} command the commentui DOM node
		 * @param {Object} $node the commentui DOM node
		 * @param {App.AnnotationsUI} ui the containing ui
		 * @param {String} commentId The id of the comment
		 * @param {String} annotationId The id of the annotation
		 */
		COMMENT_UI_AFTER_COMMAND: "commentui:after-command"
	};

	/**
	 * @member App.AnnotationsUI
	 * @property {Object} Commands
	 * strings that identify UI actions. Documented like a class, but it's a static class member
	 */
	App.AnnotationsUI.Commands = {
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [SUBMIT="comment-submit"]
		 * command for submitting a comment
		 */
		SUBMIT: "comment-submit",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [REPLY_DONE="reply-done"]
		 * command for submitting the reply text
		 */
		REPLY_DONE: "reply-done",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_CANCEL=comment-cancel"]
		 * command for submitting the reply text
		 */
		COMMENT_CANCEL: "comment-cancel",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_OPEN=open-comment"]
		 * command for submitting the reply text
		 */
		COMMENT_OPEN: "open-comment",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_CLOSE=close-comment"]
		 * command for submitting the reply text
		 */
		COMMENT_CLOSE: "close-comment",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_MENU=comment-open-menu"]
		 * command for submitting the reply text
		 */
		COMMENT_MENU: "comment-open-menu",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_MENU_ITEM=comment-menu-item"]
		 * command for submitting the reply text
		 */
		COMMENT_MENU_ITEM: "comment-menu-item",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_EDIT_OK=comment-edit-submit"]
		 * command for submitting the reply text
		 */
		COMMENT_EDIT_OK: "comment-edit-submit",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_EDIT_CANCEL=comment-edit-cancel"]
		 * command for submitting the reply text
		 */
		COMMENT_EDIT_CANCEL: "comment-edit-cancel",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_EDIT=comment-edit"]
		 * command for submitting the reply text
		 */
		COMMENT_EDIT: "comment-edit",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_RESOLVE="resolve"]
		 * command for submitting the reply text
		 */
		COMMENT_RESOLVE: "resolve",
		/**
		 * @member App.AnnotationsUI.Commands
		 * @property {String} [COMMENT_DELETE="comment-delete"]
		 * command for submitting the reply text
		 */
		COMMENT_DELETE: "comment-delete"
	}

	App.AnnotationsUI.prototype = $.extend({}, App.EventsMixin);

	var p = App.AnnotationsUI.prototype;

	/**
	 * @member App.AnnotationsUI
	 * @method init
	 * @param {App.AnnotationsUI.Configuration} options An options map</li>
	 * </ul>
	 */
	p.init = function(options) {
		if (! options) {
			App.Logger.error("AnnotationsUI inited with no options");
			return;
		}
		this._commandMap = this._createCommandMap();
		this.$container = options.container;
		this.$annotationTemplate = options.annotationTemplate;
		this.$commentTemplate = options.commentTemplate;
		if (!this.$container || !this.$container.length) {
			App.Logger.error("AnnotationsUI: Bad or missing comments container");
		}
		if (!this.$annotationTemplate || !this.$annotationTemplate.length) {
			App.Logger.error("AnnotationsUI: Bad or missing annotation template");
		}
		if (!this.$commentTemplate || !this.$commentTemplate.length) {
			App.Logger.error("AnnotationsUI: Bad or missing comment template");
		}

		this._templateClass = options.templateClass || "lance-tmpl";
		
		this._autogrowOptions = $.extend(true, {}, defaultAutogrowOptions, options.autoGrow || {});

		this._blurAware = options.blurAware !== false;
		
		this._preventScroll = (options.autoScroll === false);
		this.textareaOptions = options.textareaOptions && $.extend(true, {}, options.textareaOptions);
		
		this.setOwner(options.owner);
	}

	/**
	 * @member App.AnnotationsUI
	 * @method setGetLocalizedString
	 * @param {Function} A function that receives a key and returns a string for display in the UI,<br/>Override only if you really know what you're doing.<br/>
	 * The default implementation uses the method provided by the owner, which in turn relies on the host editor's localization mechanism.
	 * */
	p.setGetLocalizedString = function(func) {
		this._getLocalizedString = func || defaultGetLocalizedString;
	};


	/**
	 * @member App.AnnotationsUI
	 * @method getOwner
	 * @return {App.Annotations} The annotations object attached to this ui
	 * */
	p.getOwner = function(owner, options) {
		return this._owner;
	};

	/**
	 * @member App.AnnotationsUI
	 * @method setOwner
	 * Disconnects from the current owner, if any, and connects to the new owner, if not null
	 * @param {App.Annotations} The annotations object to be used as this ui's provider
	 * */
	p.setOwner = function(owner, options) {
		if (owner === this._owner) {
			return;
		}
		if (this._owner) {
			this._owner.removeListener(null, this);
		}
		this._owner = owner;
		this._getLocalizedString = (owner && owner.getLocalizedString) || defaultGetLocalizedString;
		if (owner) {
			this._setEnabled(owner.isEnabled());

			owner.bind(App.Annotations.Events.ANNOTATION_UPDATED,
				this._onAnnotationUpdated, this);
			owner.bind(App.Annotations.Events.ATTRIBUTE_CHANGED,
					this._onAnnotationAttributeChanged, this);
			owner.bind(App.Annotations.Events.ANNOTATION_CREATED,
					this._onAnnotationCreated, this);
			owner.bind(App.Annotations.Events.ANNOTATION_DELETED,
					this._onAnnotationDeleted, this);
			owner.bind(App.Annotations.Events.ANNOTATION_RESOLVED,
				this._onAnnotationResolved, this);
			owner.bind(App.Annotations.Events.ANNOTATION_SELECTED,
				this._onAnnotationSelected, this);
			owner.bind(App.Annotations.Events.ANNOTATION_SELECTED,
					this._onAnnotationSelected, this);
			owner.bind(App.Annotations.Events.COMMENT_SELECTED,
					this._onCommentSelected, this);
			owner.bind(App.Annotations.Events.COMMENT_ADDED,
					this._onCommentAdded, this);
			owner.bind(App.Annotations.Events.COMMENT_CHANGED,
					this._onCommentChanged, this);
			owner.bind(App.Annotations.Events.COMMENT_DELETED,
					this._onCommentDeleted, this);
			owner.bind(App.Annotations.Events.RESET,
					this._onReset, this);
			owner.bind(App.Annotations.Events.RELOAD,
					this._onReload, this);
			owner.bind(App.Annotations.Events.ENABLED_CHANGED,
					this._onEnabledChanged, this);
			// owner.bind(App.Annotations.Events.ANNOTATIONS_RENUMBERED,
			// 		this._onRenumbered, this);
			// owner.bind(App.Annotations.Events.SIZE_CHANGED,
			// 		this._onResize, this);
			
			owner.addCustomAttributes("data-closed");
		}
		else {
			this._isEnabled = false;
		}
		var load = options && options.load;
		if (load !== false) {
			this._reload();
		}
	};
	
	/**
	 * @method getAnnotationIdForNode
	 * returns the id of the annotation associated with a node
	 * @param {Object} $node Either a DOM node or a jquery object
	 */
	p.getAnnotationIdForNode = function(node) {
		node = this.getAnnotationNode(node);
		return node && $(node).attr(ANNOTATION_ATTR);
	};
	
	/**
	 * returns the first node in the node's DOM hierarchy which is an annotation node, including the node itself
	 * @param {Object} $node Either a DOM node or a jquery object
	 */
	p.getAnnotationNode = function($node) {
		$node = ($node instanceof $) ? $node : $($node);
		if (this.isAnnotationNode($node)) {
			return $node;
		}
		var parents = $node.parents(ANNOTATION_CLASS_SELECTOR);
		return parents[0] || null;
	};

	/**
	 * @return true if the node is an annotation node
	 * @param {Object} $node Either a DOM node or a jquery object
	 */
	p.isAnnotationNode = function($node) {
		$node = ($node instanceof $) ? $node : $($node);
		return Boolean($node.hasClass(ANNOTATION_CLASS) && $node.attr(ANNOTATION_ATTR));
	};

	p.addAnnotation = function(annotation, beforeId) {
		var node = this._getAnnotationTemplate(),
			before = this._findAnnotationUi(beforeId);
		before && before.length ? before.before(node) : this.$container.append(node);
		this._bindFocusHandlers(node);
		this._populateAnnotation(node, annotation);
		this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_CREATED, {$node: node, ui: this, id: annotation.id });
	};

	p.removeAnnotation = function(annotationId) {
		var node = this._findAnnotationUi(annotationId);
		if (node) {
			this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_REMOVED, {id: annotationId, $node: node, ui: this});
			node.remove();
		}
	};

	p.updateAnnotation = function(annotation) {
		if (annotation) {
			var $node = this._findAnnotationUi(annotation.id);
			if ($node) {
				this._populateAnnotation($node, annotation);
				this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_CHANGED, {$node: $node, ui: this, id: annotation.id });
			}
		}
	};

	p.updateComment = function(annotation, comment, status) {
		if (annotation && comment) {
			var $node = this._findCommentUi(annotation.id, comment.id);
			if ($node) {
				status = status || (this._owner && this._owner.getCommentStatus(annotation.id, comment.id));
				this._populateComment($node, comment, annotation.id, status);
				this.trigger(App.AnnotationsUI.Events.COMMENT_UI_CHANGED, {$node: $node, ui: this, id: annotation.id });
			}
		}
	};

	p.selectAnnotation = function(annotation, bSelected) {
		if (!annotation) {
			return;
		}
		var node = this._findAnnotationUi(annotation.id);
		if (! node) {
			return;
		}
		bSelected = Boolean(bSelected);

		var wasSelected = node.attr("data-selected") === "true",
			self = this;
		node.attr("data-selected", Boolean(bSelected));
		if (! bSelected) {
			node.find(COMMENT_CLASS_SELECTOR).attr("data-selected", false);
			node.find(".comment-ui[data-comment-insert=true]").each(function(i, activeNode) {	
				self._onAddCommentText($(activeNode));
			})
			node.find(".comment-ui[data-comment-edit=true]").each(function(i, commentNode) {
				self._onCancelCommentText($(commentNode));
			});
			// trigger the event before potential deletion of the node
			this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_SELECTED, 
					{isSelected: false, $node: node, ui: this, id: node.attr(ANNOTATION_ATTR) });
			// check if there's any content left
			if (this._blurAware) {
				this._owner.compactAnnotation(annotation.id);
			}
		}
		else {
			var scrollLeft, scrollTop, nd, doc, win, $win;
			if (this._preventScroll) {
				// if we prevent scrolling, save the window scroll position to restore it after 
				// we focus the node
				nd = node[0];
				doc = nd.ownerDocument,
					win = doc && (doc.defaultView || doc.parentWindow);
				if (win) {
					$win = $(win);
					scrollLeft = $win.scrollLeft();
					scrollTop = $win.scrollTop();						
				}
			}
			node.focus();
			this._handleAnnotationFocus(node);
			if (! wasSelected) {
				var cmnt = node.find(COMMENT_CLASS_SELECTOR);
				if (cmnt.length) {
					// TODO Test is this should be uncommented
					// App.utils.scrollToElement($(cmnt[cmnt.length - 1], true));
				}
			}
			if (typeof scrollTop === "number") {
				win.scrollTo(scrollLeft, scrollTop);
			}
			this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_SELECTED, 
					{isSelected: true, $node: node, ui: this, id: node.attr(ANNOTATION_ATTR) });
		}
	};
	
	p._reload = function() {
		var owner = this._owner;
		this._onReset();
		if (owner) {
			var ann, i, 
				count = owner.countAnnotations();
			for (i = 0; i < count; ++i) {
				ann = owner.getAnnotationByIndex(i);
				this.addAnnotation(ann);
			}
		}
	}
	
	p._selectComment = function(annotation, comment, bSelected, bEdit) {
		if (annotation && comment) {
			var $node = this._findCommentUi(annotation.id, comment.id);
			if ($node) {
				bSelected = Boolean( bSelected);
				bEdit = Boolean( bEdit);
				if (bSelected) {
					var annotationUi = this._findAnnotationUi(annotation.id)
					// deselect all others
					this._selectCommentNode(annotationUi.find(".comment-ui[data-selected='true']"), {select: false});
//					$node.find(".comment-text").val(comment.text).trigger("propertychange");
				}
				this._selectCommentNode($node, { select: bSelected, edit: bEdit });
			}
		}
	};
	
	p._selectCommentNode = function($node, options) {
//		App.Logger.debug("selecting comment node", options.select, "current value", $node.attr(COMMENT_ID_ATTR));
		$node.attr("data-selected", options.select);
		if (options.select && options.edit && this._isEnabled) {
			App.Logger.debug("entering comment edit mode", $node.attr(ANNOTATION_ATTR));
			$node.attr({ "data-comment-insert" :  true, "data-comment-edit" : false });
			var ta = $node.find(".comment-reply-text"), ta1;
			if (isReadOnly(ta)) {
				setReadOnly(ta, false, this.textareaOptions);
			}
			ta.focus();
			// sometimes it's too early for focus
			setTimeout(function() {
				ta.focus();
				ta.select();
			}, 50);
			if (this._blurAware) {
				var oldText = ta.value;
				function test() {
					var focused = ta.is(":focus");
					App.Logger.debug("textfield focused flag", focused, "for", $node.attr(ANNOTATION_ATTR));
					if (! focused) {
						var txt = ta.val();
						if (txt != oldText) {
							this._onAddCommentText($node)
						}
						else {
							this._onCancelCommentText($node);
						}
					}
				}
				this._addTimeout($node, this._blurTimeouts, test);
			}

			ta1 = $node.find(".comment-text");
//			if (! isReadOnly(ta1)) {
				setReadOnly(ta1, true, this.textareaOptions);
//			}
		}
	};

	/**
	 * Returns the jquery of the annotations node associated with the annotation id
	 * @param {*} id
	 * @private
	 * @ignore
	 */
	p._findAnnotationUi = function(id) {
		if (!id) {
			return null;
		}
		var node = this.$container.find(ANNOTATION_CLASS_SELECTOR + "[data-annotation-id='" + id + "']");
		return node && node.length ? node : null;
	}

	p._findCommentUi = function(annotationId, commentId) {
		if (annotationId && commentId) {
			var node = this.$container.find("[data-annotation-id='" + annotationId + "'][" + COMMENT_ID_ATTR + "='" + commentId + "']");
			return node && node.length ? node : null;
		}
		return null;
	};

	// pass null status to get a minimal update - name, date, avatar
	// if status is passed, 
	p._populateComment = function($node, comment, annotationId, status) {
		$node.find(".comment-user-name").html(comment.userName);
		$node.find(".comment-time-stamp").html(App.utils.relativeDateFormat(comment.time, this._getLocalizedString));
		$node.find(".comment-avatar").css("background-image", "url(" + comment.getUserPicture() + ")")

		if (status) {
			var selected = Boolean(status.isSelected);
			$node.attr({
				"data-comment-edit" : false,
				"data-comment-insert": false,
				"data-comment-id" : comment.id,
				"data-annotation-id": annotationId,
				"data-comment-first": Boolean(status.isFirst),
				"data-comment-last": Boolean(status.isLast),
				"data-comment-new": Boolean(status.isNew),
				"data-comment-owner": Boolean(status.isOwnerComment),
				"data-comment-can-edit": Boolean(status.canEdit),
				"data-comment-can-delete": Boolean(status.canDelete),
				"data-comment-can-resolve": Boolean(status.canResolve)
			});
			$node.find("[data-lance-command='resolve']").attr("disabled", status.canResolve ? null : "disabled");
			$node.find("[data-lance-command='comment-edit']").attr("disabled", status.canEdit ? null : "disabled");
			$node.find("[data-lance-command='comment-delete']").attr("disabled", status.canDelete ? null : "disabled");

			var ta = $node.find(".comment-text");
			ta.val(comment.text).trigger("propertychange");
			setReadOnly(ta, true, this.textareaOptions);
	
			ta = $node.find(".comment-reply-text");
			ta.attr("placeholder", this._getLocalizedString(status.isNew ? "enter your comment" : "reply to this comment"));
			resetTextArea(ta, this.textareaOptions);
			
			$node.find(".comment-ok").html(this._getLocalizedString(status.isNew ? "comment" : "reply"));
			// create jquery-ui buttons if available
			$.ui && $.ui.button && $node.find(".btn").button();	

			this._selectCommentNode($node, {select: selected});
			
			if ($.ui && $.ui.menu) {
				$node.find(".comment-edit-menu-list").menu();	//create comment menu
			}
		}
	};

	p._populateAnnotation = function($node, annotation) {
		
		var id = annotation.id;
		$node.attr({"data-annotation-id" : id, 
			"data-selected" : annotation.isSelected(), 
			"data-annotation-resolved": annotation.isResolved()? "true" : null });
		
		this._copyAnnotationAttributes(annotation, $node);

		var uis = $node.find(COMMENT_CLASS_SELECTOR);
		uis.remove();
		var container = $node.find(".annotation-comments");

		for (var i = 0, len = annotation.count(); i < len; ++i) {
			var comment = annotation.getCommentByIndex(i),
				status = this._owner.getCommentStatus(id, comment.id),
				$comment = this._getCommentTemplate(i),
				$tas;
			this._populateComment($comment, comment, id, status);
			container.append($comment);
			// autogrow after append so we can fit the size on init
			if (this._autogrowOptions) {
				$tas = $comment.find("textarea.autogrow-textarea");
				if ($tas.autoGrow)  { // only if autogrow is installed
					$tas.autoGrow(this._autogrowOptions);
				}
			}
			this.trigger(App.AnnotationsUI.Events.COMMENT_UI_CREATED, 
				{$node: $comment, ui: this, commentId: comment.id, annotationId: id });
		}
		this.trigger(App.AnnotationsUI.Events.ANNOTATION_UI_CHANGED, 
			{$node: $node, ui: this, id: id });
	};
	
	p._copyAnnotationAttributes = function(ann, $node) {
		$node.attr(ann.attributes);
	};

	p._trySelectAnnotation = function($node) {
		if (this._owner) {
			this._removeTimeouts($node, { deselect: true });
			var id = $node.attr(ANNOTATION_ATTR);
			this._owner.selectAnnotation(id, true);
		}
	};
	
	p._handleAnnotationFocus = function($node, dontSetTimeout) {
		this._removeDeselectTimeout($node);
		if (dontSetTimeout !== false) {
			var f = function() { // remove deselect timeout before it fires
//				App.Logger.debug("annotation focus in timeout fired");
				this._removeTimeouts($node, {deselect: true});
			}
			f.call(this);
			this._addTimeout($node, this._selectTimeouts, f);
		}
	};

	p._trySelectComment = function($node, bEdit) {
		this._handleAnnotationFocus($node);
		if (this._owner) {
			var selected = $node.attr("data-selected");
			if (selected !== "true" || (bEdit && isReadOnly($node.find(".comment-reply-text")))) {
//				App.Logger.debug("selecting comment");
				var aid = $node.attr(ANNOTATION_ATTR);
				var id = $node.attr(COMMENT_ID_ATTR);
				
				this._owner.selectComment(aid, id, true, bEdit);
			}
			else {
//				App.Logger.debug("not selecting comment, selected is", selected, typeof selected, (selected == "true"), (selected === true), "bedit", bEdit);
			}
		}
	};

	p._tryEditComment = function($node) {
		if (this._owner && this._isEnabled) {
			var aid = $node.attr(ANNOTATION_ATTR),
				id = $node.attr(COMMENT_ID_ATTR),
				status = this._owner.getCommentStatus(aid, id);
//			App.Logger.debug("try edit comment called, comment status is", status.isSelected);
			this._trySelectComment($node);
			status = this._owner.getCommentStatus(aid, id);
			if (status.isSelected && status.canEdit) {
				this._removeTimeouts($node, { blur: true, deselect: true });
				var ta = $node.find(".comment-reply-text");
				resetTextArea(ta, this.textareaOptions);
				$node.attr("data-comment-insert", false);
				ta = $node.find(".comment-text");
				$node.attr("data-comment-edit", true);
				setReadOnly(ta, false, this.textareaOptions);
				ta.focus();
			}
			else {
//				App.Logger.debug("tried to edit but status was", status.isSelected, "owner", status.isOwnerComment);
			}
		}
	};

	p._onDeleteComment = function($node) {
		/*begin reject delete comment*/
		if (this._owner && this._isEnabled) {
			var aid = $node.attr(ANNOTATION_ATTR),
				id = $node.attr(COMMENT_ID_ATTR),
				status = this._owner.getCommentStatus(aid, id),
				isFirst = (status && status.isFirst) || false,
				message = this._getLocalizedString(isFirst ? "delete this annotation?" : "delete this comment?"),
				$aUI = this._findAnnotationUi(aid),
				parentUI = isFirst ?  $aUI : $node,
				widthFactor = 0.97, // isFirst ? 0.97 : 0.97,
				deleteIt = function() {
					if (isFirst) {
						owner.deleteAnnotation(aid);
					}
					else {
						owner.deleteComment(aid, id);
					}
				};
			App.utils.scrollToElement(parentUI);

			var owner = this._owner;
			
			if ($.ui && $.ui.dialog) {
				var $dialog = $("<div>" + message + "</div>"),
					buttons = {

					};
				buttons[this._getLocalizedString("ok")] = function() {
					$(this).dialog("close");
					deleteIt();
				};
				buttons[this._getLocalizedString("cancel")] = function() {
					$(this).dialog("close");
				};
				$dialog.dialog( {
						resizable:false,
						modal:true,
						width: Math.round($aUI.outerWidth() * widthFactor),
						height:Math.round(parentUI.outerHeight() * 0.99),
						autoOpen:false,
						dialogClass: "no-title-dialog no-skin-dialog no-modal-dialog",
						position: {at:"left-14 top+1", my:"left top", of: parentUI},
						buttons: buttons
					}
				);
				$dialog.dialog("open");
			}
			else {
				if (window.confirm(message)) {
					deleteIt();
				}
			}
		}
		/*end reject*/
	};

	p._localizeNode = function(node) {
		var nodeType = node && node.nodeType,
			attributes,
			value,
			match,
			i, len;
		if (nodeType === 1) {
			attributes = node.hasAttributes() && node.attributes;
			if (attributes && attributes.length) {
				for (i = 0, len = attributes.length; i < len; ++i) {
					value = attributes[i].value;
					if (value && (match = String(value).match(RE_LOCALIZED_ATTRIBUTE))) {
						value = this._getLocalizedString(match[1]);
						if (value) {
							node.setAttribute(attributes[i].name, value);
						}
					}
				}
			}
			for (var child = node.firstChild; child; child = child.nextSibling) {
				this._localizeNode(child);
			}
		}
		else if (nodeType === 3 && node.nodeValue) {
			match = String(node.nodeValue).match(RE_LOCALIZED_ATTRIBUTE);
			if (match) {
				node.nodeValue = this._getLocalizedString(match[1]);
			}
		}
	};

	p._getAnnotationTemplate = function() {
		var ret = this.$annotationTemplate.clone();
		this._localizeNode(ret[0]);
		ret.removeClass(this._templateClass).addClass(ANNOTATION_CLASS);
		ret.on("click", "[data-lance-command]", function(event) { this._onCommandEvent(event); }.bind(this));

		return ret;
	};
	
	p._bindFocusHandlers = function($node) {
		$node.focusout(function(evt) {
			setTimeout((function() {
				var id = $node.attr(ANNOTATION_ATTR),
					rt = evt.relatedTarget;// || evt.target;
				// App.Logger.debug("node focus out event handler", id);
				if (rt) {
					var parent = $(rt).parents("[data-annotation-id='" + id + "']");
					if (parent && parent.length) { // the related target is part of an annotation
						App.Logger.debug("focusout, related target's parents are", parent[0]);
						return;
					}
				}
				this._onNodeLostFocus($node);
			}).bind(this), 1)
		}.bind(this));
		$node.focusin(function(evt) {
			setTimeout(function() {
				var id = $node.attr(ANNOTATION_ATTR);
				App.Logger.debug("node focus in event handler", id);
				this._trySelectAnnotation($node);
			}.bind(this), 100);
		}.bind(this));
	};

	p._setButtonsText = function($node, selector, textSelector) {
		var $child = $node.find(selector),
			$text;
		if ($child.length) {
			$text = $child.find(".ui-button-text");
			if ($text.length) {
				$child = $text;
			}
			$child.html(this._getLocalizedString({ key: textSelector, useKey: false }));
		}
	};

	p._getCommentTemplate = function(commentIndex) {
		var $node = this.$commentTemplate.clone();
		this._localizeNode($node[0]);
		$node.removeClass(this._templateClass).addClass(COMMENT_CLASS);

		$node.find(".comment-text").click((function(i,e) {
			this._trySelectComment($node, false);
		}).bind(this));

		$node.find(".comment-reply-text")
			.click((function(i,e) {
				this._trySelectComment($node, true);
			}).bind(this))
			.on("input propertychange", (function(evt) {
				this._onReplyChanged($node);
			}).bind(this));

		var setCommand = function(cls, attr) {
			$node.find(cls).attr("data-lance-command", attr);
		}

		var commandMap = {
			".comment-ok": AnnotationsUI.Commands.SUBMIT,
			".comment-new-done": AnnotationsUI.Commands.REPLY_DONE,
			".comment-cancel": AnnotationsUI.Commands.COMMENT_CANCEL,
			".comment-open": AnnotationsUI.Commands.COMMENT_OPEN,
			".comment-close": AnnotationsUI.Commands.COMMENT_CLOSE,
			".comment-edit-menu-icon": AnnotationsUI.Commands.COMMENT_MENU,
			".comment-edit-menu-list a": AnnotationsUI.Commands.COMMENT_MENU_ITEM,
			".comment-edit-ok": AnnotationsUI.Commands.COMMENT_EDIT_OK,
			".comment-edit-cancel": AnnotationsUI.Commands.COMMENT_EDIT_CANCEL,
			".comment-edit": AnnotationsUI.Commands.COMMENT_EDIT,
			".comment-resolve": AnnotationsUI.Commands.COMMENT_RESOLVE,
			".comment-delete, .comment-resolve": AnnotationsUI.Commands.COMMENT_DELETE
		};

		for (var cmd in commandMap) {
			if (commandMap.hasOwnProperty(cmd)) {
				setCommand(cmd, commandMap[cmd]);
			}
		}
		$node.click((function(evt) {
			this._trySelectComment($node);
		}).bind(this));
		
		return $node;
	}

	p._onCommandEvent = function(evt) {
		var target = evt.currentTarget,
			cmd = target && target.getAttribute && target.getAttribute("data-lance-command");
		if (!cmd) {
			App.Logger.warn("Lance onCommandEvent: missing command");
			return;
		}
		var $node = $(target).closest('['+COMMENT_ID_ATTR+']'),
			commentId = $node.attr(COMMENT_ID_ATTR),
			annotationId = $node.attr(ANNOTATION_ATTR),
			event = { command: cmd, $node: $node, ui: this, annotationId: annotationId, commentId: commentId, cancel: false };

		this.trigger(App.AnnotationsUI.Events.COMMENT_UI_BEFORE_COMMAND, event);
		// Give the host page an opportunity to override the command
		if (!event.cancel && this._commandMap[cmd]) {
			evt.preventDefault();
			this._commandMap[cmd].call(this, evt, $node);
			event = { command: cmd, $node: $node, ui: this, annotationId: annotationId, commentId: commentId };
			// notify post command execution
			this.trigger(App.AnnotationsUI.Events.COMMENT_UI_AFTER_COMMAND, event);
		}
		else {
			App.Logger.warn("Unhandled command", cmd);
		}
	};

	// TODO replace with symbolic names
	p._createCommandMap = function() {
		return {
			"comment-submit": function(evt, $node) {
					this._onAddCommentText($node);
					this._owner.doneEditing();
				},

			"resolve": function(evt, $node) {
				this._resolveAnnotationByCommentNode($node);
			},
			
			"comment-open": function(evt, $node) {
					this._setAnnotationAttribute($node, "data-closed", false);
				},

			"comment-submit-ok": function(evt, $node) {
					if ($node.find(".comment-reply-text").val()!= "")	//comment reply textbox is not empty
					{
						this._onAddCommentText($node);	//add comment
						this.trigger(App.AnnotationsUI.Events.COMMENT_UI_DONE, {$node: $node, ui: this, id: $node.attr(ANNOTATION_ATTR) });
					}
					else {
						this._onCancelCommentText($node); //cancel
					}
					this._owner.doneEditing();
				},
			
			"comment-cancel": function(evt, $node) {
					this._onCancelCommentText($node);
				},
			
			//add annotation open click action (default state is data-closed=false)
			"open-comment": function(evt, $node) {
					this._setAnnotationAttribute($node, "data-closed", false);
				},
			"comment-open-menu": function(evt, $node) {
					this._onMenuIconClicked($node);
				},

			//add annotation close click action
			"close-comment": function(evt, $node) {
					this._setAnnotationAttribute($node, "data-closed", true);
				},
			
			/* bind comment edit menu - open/close action*/
			"comment-edit-menu": function(evt, $node) {
					this._onMenuIconClicked($node);
				},
			/* bind comment edit menu - option click action (close menu after option selected)*/
			"comment-menu-item": function(evt, $node) {
					this._closeCommentMenu($node);
				},
			
			"comment-edit-submit": function(evt, $node) {
					this._onSaveCommentText($node);
				},
			
			"comment-edit-cancel": function(evt, $node) {
					this._onRevertCommentText($node);
				},

			"comment-edit": function(evt, $node) {
					this._tryEditComment($node, true);
				},
			"comment-delete": function(evt, $node) {
				this._onDeleteComment($node);
			}
		};
	};
	
	//open comment menu
	p._openCommentMenu = function($node) {
		var $iconDiv = $node.find(".comment-edit-menu-icon");			//icon div (sibling of menu)
		var $menuDivList = $node.find(".comment-edit-menu-list");		//menu div (sibling of icon)
		
		$iconDiv.attr("class", "comment-edit-menu-icon arrow-right");	//change icon to "open"
		$iconDiv.attr("data-menu-open", "true");						//update data attribute
		$menuDivList.show();											//display menu
	};
	
	p._setAnnotationAttribute = function($node, attr, value) {
		annotationId = $node.attr(ANNOTATION_ATTR);
		this._owner.setAttribute(annotationId, attr, value);
	};
	
	//close comment menu
	p._closeCommentMenu = function($node) {
		var $iconDiv = $node.find(".comment-edit-menu-icon");			//icon div (sibling of menu)
		var $menuDivList = $node.find(".comment-edit-menu-list");		//menu div (sibling of icon)

		$iconDiv.attr("class", "comment-edit-menu-icon arrow-down");	//change icon to "close"
		$iconDiv.attr("data-menu-open", "false");						//update data attribute
		$menuDivList.hide();											//hide menu
	};
	
	//menu icon (arrow) clicked
	p._onMenuIconClicked = function($node) {

		var $iconDiv = $node.find(".comment-edit-menu-icon");	//get icon div
		
		if($iconDiv.attr("data-menu-open") === "true"){//menu is opened, icon is arrow-right
			this._closeCommentMenu($node)
		}
		else{										//menu is closed, icon is arrow-down
			//close all open menus
			this._closeCommentMenu($('[data-menu-open="true"]').parentsUntil(COMMENT_CLASS_SELECTOR));
			this._openCommentMenu($node);
		}
	};

	p._resolveAnnotationByCommentNode = function($node) {
		if (!this._owner || !this._isEnabled) {
			return;
		}
		var commentId = $node.attr(COMMENT_ID_ATTR),
			annotationId = $node.attr(ANNOTATION_ATTR);
		this._owner.resolveAnnotation(annotationId, commentId, true);		
	};
	
	p._onAddCommentText = function($node) {
		this._removeTimeouts($node, {revert: true, blur: true});
		if (!this._owner || !this._isEnabled) {
			return;
		}
		var ta = $node.find(".comment-reply-text");
		if (isReadOnly(ta)) {
			return;
		}
		var commentId = $node.attr(COMMENT_ID_ATTR),
			annotationId = $node.attr(ANNOTATION_ATTR),
			text = ta.val() || "",
			trimmed = $.trim(text);
		setReadOnly(ta, true, this.textareaOptions);
		$node.attr("data-comment-insert", false);
		if (trimmed.length) {
			this._owner.addComment(annotationId, commentId, text);
		}
	};

	p._onCancelCommentText = function($node) {
		this._removeTimeouts($node, {revert: true, blur: true});
		if (this._owner && this._isEnabled) {
			var id = $node.attr(COMMENT_ID_ATTR),
				aid = $node.attr(ANNOTATION_ATTR),
				data,
				comment = this._owner.getComment(aid, id),
				text = $node.find(".comment-text");
			if (comment && (text != comment.text)) {
				this._owner.revertComment(aid, id, true);
				data = this._owner.getComment(aid, id);
				this._onCommentChanged(data);
			}
		}
	}
	
	p._onSaveCommentText = function($node) {
		this._removeTimeouts($node, {all: true});
		var ta = $node.find(".comment-text");
		if (! this._isEnabled || isReadOnly(ta)) {
			return;
		}
		setReadOnly(ta, true, this.textareaOptions);
		$node.attr("data-comment-edit", false);
		if (this._owner) {
			var id = $node.attr(COMMENT_ID_ATTR);
			var annotationId = $node.attr(ANNOTATION_ATTR);
			this._owner.setCommentText(annotationId, id, ta.val());
			this._owner.doneEditing();
		}
		this.trigger(App.AnnotationsUI.Events.COMMENT_UI_DONE, {$node: $node, ui: this, id: $node.attr(ANNOTATION_ATTR) });
	}
	
	p._removeTimeouts = function($node, options) {
		var timeouts = [],
			all = Boolean(options && options.all);
		if (all || options.revert) {
			timeouts.push(this._revertTimeouts);
		}
		if (all || options.blur) {
			timeouts.push(this._blurTimeouts)
		}
		if (all || options.deselect) {
			timeouts.push(this._deselectTimeouts);
		}
		if (all || options.select) {
			timeouts.push(this._selectTimeouts);
		}
		timeouts.forEach(function(array) {
			this._removeTimeout($node, array);
		}.bind(this));

	}

	p._removeRevertTimeout = function($node) {
		this._removeTimeout($node, this._revertTimeouts);
	}
	
	p._removeDeselectTimeout = function($node) {
		this._removeTimeout($node, this._deselectTimeouts);
	}
	
	p._removeTimeout = function($node, timeouts) {
		var id =$node.attr(ANNOTATION_ATTR), i, rec;
		for (i = timeouts.length - 1; i >= 0; --i) {
			rec = timeouts[i];
			if (rec.node && (rec.node.attr(ANNOTATION_ATTR) === id)) {
//				App.Logger.debug("removing node from timeouts", rec.timeout);
				if (rec.timeout) {
					clearTimeout(rec.timeout);
					rec.timeout = null;
				}
				timeouts.splice(i, 1);
			}
		}
	}
	
	p._addTimeout = function($node, timeouts, callback) {
		
		this._removeTimeout($node, timeouts);
		var o = {
				node : $node
			};
		var f = function() {
//			App.Logger.debug("timeout", o.timeout, "fired");
			this._removeTimeout($node, timeouts);
			callback.call(this);
		}
		o.timeout = setTimeout(f.bind(this), 210);
//		App.Logger.debug("added timeout", o.timeout)
		timeouts.push(o);
	}
	
	p._hasTimeout = function($node, timeouts) {
		var id =$node.attr(ANNOTATION_ATTR);
		var ind = timeouts.firstIndexOf_li(function(e) {
			return (e.node && (e.node.attr(ANNOTATION_ATTR) == id));
		});
		return (ind >= 0);
	}
	
/*	p._onBlurCommentText = function(textArea, $node, allowDelete) {
		var f = function() {
			if (! textArea.getAttribute("readonly") && ! textArea.value) {
				this._onRevertCommentText($node, allowDelete);
			}
		}
		this._addTimeout($node, this._revertTimeouts, f)		
	} */
	
	p._onNodeLostFocus = function($node) {
		var f = function() {
			var id = $node.attr(ANNOTATION_ATTR);
			this._owner.selectAnnotation(id, false);
		}
		this._removeTimeout($node, this._selectTimeouts);
		this._addTimeout($node, this._deselectTimeouts, f);
	}

	p._onReplyChanged = function($node) {
		var hasText = Boolean($node.find(".comment-reply-text").val());
		var btn = $node.find(".comment-ok")
		if (hasText) {
			btn.removeAttr("disabled");
		}
		else {
			btn.attr("disabled", "disabled")
		}
	}
	
	p._onRevertCommentText = function($node, allowDelete) {
		if (! this._isEnabled) {
			return;
		}
		this._removeRevertTimeout($node);
		$node.attr("data-comment-edit", false);
		setReadOnly($node.find(".comment-text"), true, this.textareaOptions);
		if (this._owner) {
			var id = $node.attr(COMMENT_ID_ATTR);
			var annotationId = $node.attr(ANNOTATION_ATTR);
			this._owner.revertComment(annotationId, id, allowDelete);
			var data = this._owner.getComment(annotationId, id);
			this._onCommentChanged(data);
			
		}
	}

	p._onAnnotationChanged = function(data) {
		this.updateAnnotation(data && data.annotation);
	}

	p._onAnnotationSelected = function(data) {
		if (data) {
			this.selectAnnotation(data.annotation, data.isSelected);
		}
	}

	p._onAnnotationResolved = function(data) {
		this.updateAnnotation(data && data.annotation);
	};

	p._onAnnotationUpdated = function(data) {
		this.updateAnnotation(data && data.annotation);
	}
	
	p._onAnnotationDeleted = function(data) {
		this.removeAnnotation(data && data.id);
		this._setUpdateInterval();
	}

	p._onAnnotationCreated = function(data) {
		if (data) {
			this.addAnnotation(data.annotation, data.before);
			this._setUpdateInterval();
		}
	}

	p._onCommentSelected = function(data) {
		if (data) {
//			App.Logger.debug("comment", data.comment.id, "selected", data.isSelected);
			this._selectComment(data.annotation, data.comment, data.isSelected, data.isEdit);
		}
	};
	
	p._onAnnotationAttributeChanged = function(data) {
		var $node = this._findAnnotationUi(data.annotation.id);
		this._copyAnnotationAttributes(data.annotation, $node);
	}
	
	p._onCommentChanged = function(data) {
		if (data) { // reset all comments in this annotation
			this.updateComment(data.annotation, data.comment, data.status);
		}
	}
	
	p._onCommentAdded = function(data) {
		if (data) {
			this._onAnnotationChanged(data);
		}
	}
	
	p._onCommentDeleted = function(data) {
		this.updateAnnotation(data && data.annotation);
	}
	
	p._onReset = function() {
		this.$container.find("textarea").unbind();
		this.$container.find("a").unbind();
		this.$container.find(ANNOTATION_CLASS_SELECTOR).remove();
	};
	
	p._onReload = function() {
		this._reload();
	};
	
	p._onEnabledChanged = function(data) {
		var enabled = data && data.isEnabled;
		this._setEnabled(enabled);
	};

	p._onRenumbered = function(data) {
		// var ids = data && data.sequence,
		// 	self = this;
		// if (ids && ids.length) {
		// 	ids.forEach(function(id, i) {
		// 		var ui = self._findAnnotationUi(id);
		// 		if (ui) {
		// 			ui.attr("data-annotation-seq", i);
		// 		}
		// 	});
		// }
	};
	
	p._setEnabled = function(bEnabled) {
		this._isEnabled = Boolean( bEnabled);
		if (! this._isEnabled) {
			setReadOnly(this.$container.find("textarea"), true, this.textareaOptions);
			this.$container.attr("disabled", "disabled");
		}
		else {
			this.$container.removeAttr("disabled");
		}
	}
	
	p._setUpdateInterval = function() {
		var count = this._owner.countAnnotations();
		if (count > 0) {
			this._updateInterval = this._updateInterval || setInterval(this._updateUIPeriodical.bind(this), 60000);
		}
		else {
			if (this._updateInterval) {
				clearInterval(this._updateInterval);
				this._updateInterval = null;
			}
		}
	}
	
	/**
	 * @private
	 * @ignore
	 * re-populates all comment nodes with the owner data
	 */
	p._updateUIPeriodical = function() {
		var count = this._owner.countAnnotations(),
			i, j, len, ann, $ui, comment, $cui;
		for (i = 0; i < count; ++i) {
			ann = this._owner.getAnnotationByIndex(i);
			$ui = this._findAnnotationUi(ann.id);
			if ($ui) {
				for (j = 0, len = ann.count(); j < len; ++j) {
					comment = ann.getCommentByIndex(j);
					$cui = $ui.find("[data-comment-id='" + comment.id + "']");
					this._populateComment($cui, comment);
				}
			}
			
		}
	}

}(window && window["$LOOPINDEX$"], window && window.jQuery));
