/// <reference types="jquery" />
/// <reference types="ckeditor" />

interface UserRecord {
	name: string;
	id: string;
	image: string;
}

declare var FLITE: any;

const MAX_EDITORS = 4;

(function ($: JQueryStatic) {
	function warn(...args: Array<any>): void {
		console.warn.apply(console, args);
	}

	class EditorState {
		editor: CKEDITOR.editor;
		checkedUsers: any;
		userId: string;
		constructor(e: CKEDITOR.editor) {
			this.editor = e;
			this.checkedUsers = {};
		}
	}

	const EDITOR_OPTIONS = {
		width: "100%",
		height: "20%",
		extraPlugins: 'base64image,font,justify,colorbutton,copyformatting,pagebreak,customFormat,customTab,capitalizeLetter,lance,save,pasteFromGoogleDoc,flite',
        removePlugins: 'image,flash,forms,print,preview,iframe,templates,elementspath,format,tab,bidi,dialogadvtab,find,language,liststyle,newpage,selectall,smiley,colordialog,div,indentblock,showblocks',
        toolbar: [
            { name: 'tools', items: ['Maximize', 'Save'] },
            { name: 'clipboard', items: ['Cut', 'Copy', 'Paste', 'PasteText', 'PasteFromWord', '-', 'Undo', 'Redo'] },
            { name: 'editing', groups: ['find', 'selection', 'spellchecker'], items: ['Find', 'Replace', 'SelectAll', 'Scayt'] },
            { name: 'links', items: ['Link', 'Unlink', 'Anchor'] },
            { name: 'insert', items: ['Table', 'HorizontalRule', 'SpecialChar', 'PageBreak', 'base64image'] },
            { name: 'forms' },
            { name: 'document', items: ['Source'] },
            { name: 'others', items: ['mergeFieldsCombo'] },
            '/',
            { name: 'basicstyles', items: ['Bold', 'Italic', 'Underline', 'Strike', '-', 'CopyFormatting', 'RemoveFormat'] },
            { name: 'paragraph', items: ['NumberedList', 'BulletedList', '-', 'Outdent', 'Indent', '-', 'Blockquote', 'CreateDiv', '-', 'JustifyLeft', 'JustifyCenter', 'JustifyRight', 'JustifyBlock'] },
            { name: 'styles', items: ['Styles', 'Format', 'Font', 'FontSize'] },
            { name: 'colors', items: ['TextColor', 'BGColor'] },
            { name: 'about', items: ['About'] },
            { name: 'lance', items: ['annotate'] },
            { name: "flite", items: [ "flite-toggletracking", "flite-toggleshow", "flite-acceptone", "flite-rejectone", "flite-acceptall",  "flite-rejectall" ] },
        ],
	flite: {
		// set to false if you want change tracking to be off initially
			isTracking: true,
			userStyles: {
				"21": 3,
				"15": 1,
				"18": 2
			},

			// these are the default tooltip values. If you want to use this default configuration, just set flite.tooltips = true;
			tooltips: {
				show: true,
				cssPath: "css/opentip.css",
				delay: 500
			},
			tooltipTemplate: "%a by %u, first edit %t, last edit %T"
		},
		enterMode: CKEDITOR.ENTER_P,
		autoParagraph: false,
		title: false
	};

	const users: Array<UserRecord> = [
		{ name: "Fred", id: "18", image: "avatars/fred.png" },
		{ name: "Mary", id: "17", image: "avatars/mary.png" },
		{ name: "David", id: "15", image: "avatars/david.png" },
		{ name: "Syd", id: "21", image: "avatars/syd.png" }
	];
	const testData = `'<p>Aug 11 2013</p>
		<p><span class="ice-ins ice-cts-1" data-flite-cid="2" data-time="1376218678796" data-userid="15" data-username="David" >Added by David</span>, then 
		<span class="ice-ins ice-cts-2" data-flite-cid="11" data-time="1376218687062" data-userid="18" data-username="Fred" >added by Fred</span>, 
		subsequently <span class="ice-del ice-cts-3" data-flite-cid="3" data-time="1376243289388" data-userid="21" data-username="Syd" >deleted by Syd</span>, 
		then <span class="ice-ins ice-cts-3" data-flite-cid="19" data-time="1376218693458" data-userid="21" data-username="Syd" >added by Syd</span> 
		using the <b>Track Changes CKEditor Plugin</b>.</p>
		<p>Aug 11 2000</p>
		<p><span class="ice-ins ice-cts-1" data-flite-cid="21" data-time="966006011847" data-userid="15" data-username="David" >Added by David</span>, 
		then <span class="ice-ins ice-cts-2" data-flite-cid="111" data-time="966006011847" data-userid="18" data-username="Fred" >added by Fred</span>, 
		subsequently <span class="ice-del ice-cts-3" data-flite-cid="113" data-time="966006011847" data-userid="21" data-username="Syd" >deleted by Syd</span>, 
		then <span class="ice-ins ice-cts-3" data-flite-cid="119" data-time="966006011847" data-userid="21" data-username="Syd" >added by Syd</span> using the <b>Track Changes CKEditor Plugin</b>.</p>'`;
	const ckeditorConfigUrl = "../ckeditor-conf.js";

	class Demo {

		private editorStates: { [key: string]: EditorState } = {};
		private nextEditorId = 1;
		private editorId: string = null;
		private $select: JQuery;

		public init() {
			let user: UserRecord,
				name: string,
				html: string = "",
				h: string = "";
			for (let i = 0, len = users.length; i < len; ++i) {
				user = users[i];
				name = "user-" + i;
				h = '<input type="checkbox" class="user-cb" id="' + name + '" name="' + name + '" data-userid="' + user.id + '" /><label for="' + name + '">' + user.name + '</label>';
				html += h;
			}
			this.$select = $("#users-select");

			$("#user-filters").html(html);
			$(".ckeditor-version-name").html(CKEDITOR.version);

			(CKEDITOR as any).timestamp = 0x8999;
			$(".ckeditor-version").html(CKEDITOR.version);

			this.setSpellChecker();

			// Create users dropdown menu
			(() => {
				let select: HTMLSelectElement = this.$select[0] as HTMLSelectElement;
				$.each(users, (i: number, user: UserRecord) => {
					var option = new Option(user.name, String(user.id));
					select.options[i] = option;
				});
				this.$select.change(this.onUserChanged.bind(this));
				this.addEditor();
			})();


			$("#add-editor").click((event: Event) => {
				event.preventDefault();
				this.addEditor();
			});

			$("#test-data").click((event: Event) => {
				event.preventDefault();
				var state = this.editorStates[this.editorId];
				if (state) {
					state.editor.setData(testData);
				}
				return false;
			});

			$("#reject-match").click((event: Event) => {
				event.preventDefault();

				var state = this.editorStates[this.editorId];
				if (state) {
					var checked = this.getCheckedUsers(),
						flite = state.editor.plugins.flite;
					flite.findPlugin(state.editor).rejectAll({ include: checked });
				}
				return false;
			})

			$("#reject-non-match").click((event: Event) => {
				event.preventDefault();
				var state = this.editorStates[this.editorId];
				if (state) {
					var checked = this.getCheckedUsers(),
						flite = state.editor.plugins.flite;
					flite.findPlugin(state.editor).rejectAll({ exclude: checked });
				}
				return false;
			});

			$("#accept-match").click((event: Event) => {
				event.preventDefault();
				let state = this.editorStates[this.editorId];
				if (state) {
					var checked = this.getCheckedUsers(),
						flite = state.editor.plugins.flite;
					flite.findPlugin(state.editor).acceptAll({ include: checked });
				}
				return false;
			});

			$("#accept-non-match").click((event: Event) => {
				event.preventDefault();
				let state = this.editorStates[this.editorId];
				if (state) {
					var checked = this.getCheckedUsers(),
						flite = state.editor.plugins.flite;
					flite.findPlugin(state.editor).acceptAll({ exclude: checked });
				}
				return false;
			});
		}

		addEditor(): void {
			if (this.countEditors() >= MAX_EDITORS) {
				warn("Max number of editors reached");
				return;
			}
			let tmpl: JQuery = jQuery(".editor-tmpl").clone(false),
				id: string = "editor-" + this.nextEditorId++;
			tmpl.removeClass("editor-tmpl").addClass("editor-tab");
			tmpl.find("textarea").attr({
				id: id,
				name: id
			})
			jQuery(".editor-tabs").prepend(tmpl);
			this.loadEditor(id, true);
		}

		loadEditor(id: string, focus: boolean) {

			let state = this.editorStates[id],
				$add = $("#add-editor"),
				nEditors: number = this.countEditors() + 1;

			if (state) {
				$('#' + id).val("This editor was <strong>reloaded</strong>");
			}
			jQuery(".editor-container").attr("data-num-editors", nEditors);

			let editor: CKEDITOR.editor = CKEDITOR.replace(id, EDITOR_OPTIONS);

			if (nEditors >= MAX_EDITORS) {
				$add.attr({
					"disabled": "disabled",
					title: "We hope 4 editors are enough to convince you that our plugin works with multiple instances of CKEditor."
				});
			}
			else if ($add.length) {
				$add[0].removeAttribute("disabled");
				$add.attr("title", "Add more CKEditor instances to the page")
			}

			editor.on("loaded", () => {
				let availHeight: number = $(".editor-tabs").height(),
					editorHeight = Math.round(availHeight / (nEditors));

                console.log("editor plugins: ");
                // console.log(JSON.stringify(editor.plugins));
                var obj: any = editor.plugins;
                var names = [];
                for (var property in obj) {
                    if (obj.hasOwnProperty(property)) {
                        names.push(obj[property].name);
                    }
                }
                console.log(JSON.stringify(names.sort()));
                console.log(names.sort());

				this.editorStates[id] = new EditorState(editor);
				Object.keys(this.editorStates).forEach((key: string) => {
					let state: EditorState = this.editorStates[key];
					if (state) {
						state.editor.resize("100%", editorHeight, false);
					}
				});
			})


			editor.on("focus", () => {
				this.onEditorSelected(id);
			});
			editor.on(FLITE.Events.SHOW_HIDE, (event: any) => {
				var show = event.data.show;
				//			this.$sidebar.find("#show-status").text(show ? "Shown" : "Hidden").toggleClass("on", show);
			});

			// called each time a new instance of an FLITE tracker is created
			editor.on(FLITE.Events.INIT, function (event: any) {
				var flite = event.data.flite;
				flite.toggleShow(true);
                var enter = "N/A";
                if (EDITOR_OPTIONS.enterMode == CKEDITOR.ENTER_BR) {
                    enter = 'ENTER_BR';
                } else if (EDITOR_OPTIONS.enterMode == CKEDITOR.ENTER_P) {
                    enter = 'ENTER_P';
                } else if (EDITOR_OPTIONS.enterMode == CKEDITOR.ENTER_DIV) {
                    enter = 'ENTER_DIV';
                }
                $(".flite-version").html(flite.version + "   " + enter);
			});

			if (focus) {
				editor.on(FLITE.Events.INIT, (event: any) => {
					this.onEditorSelected(id);
				});

				editor.on("loaded", (e: any) => {
					this.onEditorSelected(id);
				});
			}

		}

		public setSpellChecker(): void {
			const languagesById = {
				1: "nb_NO",
				2: "nn_NO",
				3: "se_NO",
				4: "en_US"
			}

			//Spelling-Language. For now always choose norwegian bokmål - later on we must remember what user has selected and choose that one over again. Can't be depended on ui-language!
			//it seems like within same session (even with a refresh of browser) the selected spelling-language by enduser is always remembered (due to localstorage items for webspellchecker).
			const spellingLanguage = "nb_NO";

			//Must handle the URL to support either the one that is accessible from internet and the one that is only accessible from NHN
			//https://webspellchecker.visma.com vs https://webspellchecker.nhn.visma.com
			CKEDITOR.config.scayt_srcUrl = 'https://webspellchecker.visma.com/spellcheck/lf/scayt3/ckscayt/ckscayt.js?1554481948628';
			CKEDITOR.config.wsc_customLoaderScript = 'https://webspellchecker.visma.com/spellcheck/lf/22/js/wsc_fck2plugin.js';

			//http://wiki.webspellchecker.net/doku.php?id=scayt_parameters_ckeditor4&s[]=encrypted&s[]=customer&s[]=id
			//config.scayt_customerId = 'your-long-encrypted-customer-id';
			CKEDITOR.config.scayt_autoStartup = false;
			CKEDITOR.config.scayt_ignoreAllCapsWords = true;
			CKEDITOR.config.scayt_ignoreDomainNames = true;

			CKEDITOR.config.scayt_sLang = spellingLanguage;
			CKEDITOR.config.wsc_lang = spellingLanguage;

			//we can't save customer dictonaries yet - so remove 'add' by stating to only show ignore
			CKEDITOR.config.scayt_contextCommands = 'ignore';
			//config.scayt_userDictionaryName = 'MyDictionary'; // Hmm - what to add here?  "PPT-PROD-<ORGID>-<EmployeeID>" ??
		}

		private onEditorSelected(id: string) {
			let state = this.editorStates[this.editorId];
			if (state) {
				var checks = this.getCheckedUsers();
				var c = {};
				checks.forEach((e: string) => {
					c[e] = true;
				});
				state.checkedUsers = c;
				this.findEditorTab(this.editorId).removeClass("is-selected");
			}

			state = this.editorStates[id];
			if (!state) {
				return;
			}

			this.editorId = id;
			this.selectUser(state.userId || users[0].id, true);
			this.setCheckedUsers(state.checkedUsers);
			this.findEditorTab(this.editorId).addClass("is-selected");
			state.editor.focus();
		}

		private onUserChanged(event: Event) {
			let target = event.currentTarget,
				id: string = $(target).val();
			this.selectUser(id, false);
			let state = this.editorStates[this.editorId];
			state && state.editor.focus();
		}

		private selectUser(id: string, inUI: boolean) {
			if (inUI === true) {
				return this.$select.val(id).change();
			}
			let i;
			for (i = 0; i < users.length; ++i) {
				if (String(users[i].id) === id) {
					break;
				}
			}
			var user = users[i];
			var state = this.editorStates[this.editorId];
			if (user && state) {
				state.userId = id;
				var flite = state.editor.plugins.flite;
				flite && flite.findPlugin(state.editor).setUserInfo(user);
				$("#user-picture").attr("src", user.image);
			}
		}

		private findEditorTab(id: string): JQuery {
			return jQuery('#' + id).parent(".editor-tab");
		}

		private getCheckedUsers(): Array<string> {
			let checks: JQuery = $("#user-filters input:checked"),
				checked: Array<string> = [];
			checks.each((i: number, e: Element) => {
				checked.push(e.getAttribute("data-userid"));
			});
			return checked;
		}

		setCheckedUsers(checked: { [name: string]: any }) {
			var $checks = $("#user-filters input[type=checkbox]");
			checked = checked || {};
			$checks.each((i: number, e: Node) => {
				let $e = $(e),
					id = $e.attr("data-userid");
				$e.prop("checked", id in checked);
			});
		}

		private countEditors(): number {
			return Object.keys(this.editorStates).filter((key: string) => key.indexOf("editor-") === 0).length;
		}
	}

	let demo: Demo;
	if (typeof (jQuery) == "undefined" || typeof (CKEDITOR) == "undefined") {
		alert("To run this demo, please install ckeditor in a folder called ckeditor next to the demo file, then install the FLITE plugin as described in the documentation. Thanks.");
	}
	else {
		$(() => {
			demo = new Demo();
			demo.init();
		});
	}
}(jQuery));
