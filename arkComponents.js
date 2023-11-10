/*
 * Client side.
 */

export function ajaxAndLoad(url, method, data, success, error, spinner) {
	let ajaxCall = {
		url: url,
		method: method,
		success: (r) => {
			$(spinner).hide();
			success(r);
		}
	};

	if (data)
		ajaxCall.data = data;

	if (error) {
		if (typeof error == 'string')
			ajaxCall.error =  (jqXHR, status, thrown) => {
				alert(`${error}: ${this.name} ${status} (${jqXHR.statusText})`);
			}
		else
			ajaxCall.error = error;
	}

	$.ajax(ajaxCall);
}


var _arkBSDataLoad = new Map();

class arkBSDataLoad {
	name;
	dataSource;
	elements = {};
	options;
	data;
	querying;
	selectedIndex;
	
	constructor(name, dataSource, options) {
		this.name = name;

		if (typeof dataSource == 'string')
			this.dataSource = {
				url: dataSource,
				method: 'GET'
			};
		else
			this.dataSource = dataSource;

		this.options = (options || {});

		this.elements.main = document.getElementById(name);
		if (!this.elements.main)
			throw new Error(`arkBSDataLoad: no element with id="${name}" found`);
		//this.readBSElements();

		_arkBSDataLoad.set(name, this);

		// check for a form filter
		try {
			if (this.options.filterForm) {
				this.options.filterFormElement = $(`#${this.options.filterForm}`);
				if (!this.options.filterFormElement) {
					alert(`arkBSDataLoad filterForm ${this.options.filterForm} not found`);
				} else {
					this.options.filterFormButton = $(`#${this.options.filterForm} button`);
				}
				//console.log(this.options.filterFormElement, this.options.filterFormButton);

				if (this.options.filterFormButton)
					$(this.options.filterFormButton).click(() => {
						let urlFilterQuery = '';
						$(`#${this.options.filterForm} input`).each((i,el) => {
							let v = $(el).val();
							if (v)
								urlFilterQuery += (urlFilterQuery ? '&' : '') + $(el).attr('id') + '=' + v;
						});
						this.urlFilterQuery = urlFilterQuery;
						//debugconsole.log('set this.urlFilterQuery', this.urlFilterQuery);
						this.update();
					});
			}
		} catch(e) {
			alert('arkBSDataLoad constructor error processing options.filterForm', e);
		}

		return this;
	}


	/**
	 * Loads data and updates HTML
	 * Calls reloadDataSource() and updateDisplay()
	 */
    update(urlFilterQuery, processData) {
		this.reloadDataSource(urlFilterQuery)
			.then((data) => {
				if (processData)
					this.data = data.map(processData);
				else
					this.data = data;
				
				this.selectedIndex = null;
				this.updateDisplay();
			})
			.catch((err) => {
				console.log(this.data);
				alert('The dice tumbled and shows: ' + err);
			});
		return this;
	}

	/**
	 * Does the same as update(), but does NOT calls reloadDataSource().
	 * The data is received as parameter here.
	 */
	updateDirect(data, processData) {
		if (processData)
			this.data = data.map(processData);
		else
			this.data = data;

		this.selectedIndex = null;
		this.updateDisplay();
		return this;
	}

	/*
	 * Checks this.data (previously loaded and stored) and returns the record selected by the user.
	 */
	getRecord() {
		//debugconsole.log(`${this.name} getRecord() ${this.selectedIndex}`);
		//debugconsole.log(typeof this.selectedIndex);
		if (typeof this.selectedIndex == 'number')
			return this.data[ this.selectedIndex ];
	}

	/* Similar to getRecord(), but instead returns the record index in the internal data array.
	 * Useful for checking on the HTML element, since it will have the property data-index with the same number
	 */
	getIndex() {
		if (typeof this.selectedIndex == 'number')
			return this.selectedIndex;
	}

	updateDisplay() {
	}
	
	reloadDataSource(urlFilterQuery) {
		// check if an ajax query was already started
		if (this.querying) {
			console.log(`Martian Manhunter heard someone yell "${this.name}" but was occupied`);
			return;
		}

		/* check if we have filters.
		   If one was passed as parameter it will be used,
		   otherwise the constructed one (based on filterForm)
		*/
		let filterQuery = (urlFilterQuery || this.urlFilterQuery);

		//debugconsole.log('data source is', this.dataSource);
		if (this.dataSource)
			return new Promise((resolve, reject) => {
				if (typeof this.dataSource == 'function') {
					//debugconsole.log('data source is a function', this.dataSource);
					resolve(this.dataSource());
					return;
				} else
					this.querying = true;
				//debugconsole.log('data source + filterQuery is', this.dataSource.url + (filterQuery ? '?' + filterQuery : ''));
				$.ajax({
					url: this.dataSource.url + (filterQuery ? '?' + filterQuery : ''),
					method: this.dataSource.method,
					success: (data) => {
						this.querying = false;
						this.data = data;
						resolve(data);
					},
					error: (jqXHR, status, thrown) => {
						this.querying = false;
						alert(`Failure reloading data from site: ${status} (${jqXHR.statusText})`);
						reject(status);
					}
				});
			});
		else	// if (this.dataSource)
			return new Promise((resolve, reject) => {
				resolve(null);
			});
	}
}



export class arkBSCard extends arkBSDataLoad {
	constructor(name, dataSource, options) {
		//this.name = name;
		super(name, dataSource, options);

		this.readBSElements();

		return this;
	}

	readBSElements() {
		let el, first_body = 0;

		// first check if there's a card-img-overlay
		el = $(this.elements.main).children('.card-img-overlay');
		//console.log('looking for card-img-overlay');
		//console.log(el);
		//console.log(this.elements.main);
		if (el.length) {
			this.elements.body = el[0];
			this.elements.bodyclass = 'card-img-overlay';
			//console.log('card-img-overlay found');
			first_body = 1;
			//localize also the <img> element
			el = $(this.elements.main).children('img');
			if (el) {
				this.elements.img = el[0];
				if (this.options.imgsrc && typeof this.options.imgsrc == 'string')
					$(this.elements.img).attr('src', this.options.imgsrc);
			}
		} else {
		    // no card-img-overlay but there is an <img class="img-fluid"> element?
			el = $(this.elements.main).find('img.img-fluid');
			if (el) {
				this.elements.img = el[0];
				if (this.options.imgsrc && typeof this.options.imgsrc == 'string')
				    $(this.elements.img).attr('src', this.options.imgsrc);
			    //console.log('got this img', el);
			}
		}
		// check if there's a card-body
		// if no card-img-overlay was found, then this will be the 1st
	    el = $(this.elements.main).find('.card-body');
	    //console.log('found card-body?', el, first_body);
		if (first_body == 0) {
			if (Array.isArray(el) || typeof el == 'object')
				this.elements.body = el[0];
			else
				this.elements.body = el;
			//this.elements.body = (Array.isArray(el) ? el[0] : el);
		    this.elements.bodyclass = 'card-body';
			console.log('this.elements.body', this.elements.body);
		} else
			this.elements.otherbodies = [ el[0] ];
		// multiple card-body
		if (el.length > 1) {
			if (!this.elements.otherbodies)
				this.elements.otherbodies = [];
			for (let i = 1; i < el.length; i++)
				this.elements.otherbodies.push(el[i]);
		}
		console.log('this.elements.otherbodies', this.elements.otherbodies);

		// check if there's a list-group
		el = $(this.elements.main).children('.list-group').first();
		if (el)
			this.elements.list = el;
		}

	updateDisplay() {
		if (this.elements.list && this.options.list && this.data)
			try {
				let list = '';
				this.elements.list.empty();
				this.data.forEach((r, ri) => {
					let text = this.options.list(r);
					list += '<li class="list-group-item">' + text + '</li>';
				});
				this.elements.list.append(list);
			} catch(e) {
				alert(`But ${this.name} doesn't eat raisins`);
			}
		else if (!this.data)
			console.log(`The can labeled ${this.name} is empty.`);

	    //console.log('this.elements.body', this.elements.body, 'this.options.body', this.options.body);
		if (this.elements.body && this.options.body) {
			try {
				//console.log('this.elements.body');
				//console.log(this.elements.body);
				//console.log('this.elements.otherbodies');
				//console.log(this.elements.otherbodies);
				let content;
				// main body
				try {
					content = this.options.body(this.data);
				} catch(e) {
					alert('Under the lantern it is written:', this.name, e);
					console.log('Under the lantern it is written:', this.name, e);
				}
				if (typeof content != 'undefined' && content)
					$(this.elements.body).empty().append(content);
				// other bodies, if any
				/*
				if (this.elements.otherbodies)
					this.elements.otherbodies.forEach((o, i) => {
						try {
							content = this.options.body(this.data, i);
						} catch(e) {
							alert('Beneath the pool it is written:', this.name, e);
							console.log('Beneath the pool it is written:', this.name, e);
						}
						if (typeof content != 'undefined' && content)
							$(o).empty().append(content);
					});
				*/
				
				if (this.elements.img && this.options.imgsrc && typeof this.options.imgsrc == 'function')
					$(this.elements.img).attr('src', this.options.imgsrc(this.data));
			} catch(e) {
				alert(`The ${this.name} pea flew to the moon`);
			}
		}
	}
}


export class arkBSList extends arkBSDataLoad {
	constructor(name, dataSource, options) {
		super(name, dataSource, options);

		this.readBSElements();

		return this;
	}

	readBSElements() {
		if (this.options.tabbed) {
			// It's a tabbed list, so we have two subelements: the tabs list, and their contents
			this.elements.tabs = $(this.elements.main).children().first();
			this.elements.tabcontent = $(this.elements.main).children().eq(1);
		} else {
			// not tabbed list.
			let eltype = $(this.elements.main).prop('nodeName');
			// Then list ust be <ul>, <ol>, or <div>
			if (!['UL','OL','DIV'].includes(eltype)) {
				alert(`arkBSList readBSElements ${this.name}: type isn't ul, ol, or div`);
				return;
			}
			this.elements.mainType = eltype;
			// Must also be of class list-group
			if (!$(this.elements.main).hasClass('list-group')) {
				alert(`arkBSList readBSElements ${this.name}: not list-group`);
				return;
			}
		}
	}

	updateDisplay() {
		if (this.options.tabbed) {
			// tabbed list
			try {
				this.elements.tabs.empty();
				this.elements.tabcontent.empty();
				//let number = 1;
				let tabs = `<div class="list-group" id="${this.name}-list-tab" role="tablist">`;
				let tabcontent = `<div class="tab-content" id="${this.name}-nav-tabContent">`;
				this.data.forEach((r, ri) => {
					let text = this.options.print(r);
					let content = this.options.printContent(r);
					let rowid = this.options.rowid(r);
					tabs += '<a class="list-group-item list-group-item-action' + /*(number == 1 ? ' active' : '') +*/ `" id="${this.name}-${rowid}" data-bs-toggle="list" href="#tab-${this.name}-${rowid}" role="tab" aria-controls="tab-${this.name}-${rowid}" data-index="${ri}">` + text + '</a>';
					tabcontent += `<div class="tab-pane fade` + /*(number++ == 1 ? ' show active' : '') +*/ `" id="tab-${this.name}-${rowid}" role="tabpanel" aria-labelledby="${this.name}-${rowid}">` + content + '</div>';
				});
				this.elements.tabs.append(tabs + '</div>');
				this.elements.tabcontent.append(tabcontent + '</div>');

				// defines event for all tabs: when selected update this.selectedIndex
				let tabElms = document.querySelectorAll(`[id="${this.name}-list-tab"] a[data-bs-toggle="list"]`);
				let yesthis = this;
				tabElms.forEach(function(tabElm) {
					tabElm.addEventListener('shown.bs.tab', function (event) {
						//console.log('selectedIndex', $(event.target).data('index'));
						yesthis.selectedIndex = $(event.target).data('index'); // newly activated tab
						if (yesthis.options.onSelect)
							yesthis.options.onSelect(yesthis.getRecord());
						//event.relatedTarget // previous active tab
					});
				});
				
				// selects first tab
				let firstTab = new bootstrap.Tab($(this.elements.tabs).children().first());
				firstTab.show();
			} catch(e) {
				alert('arkBSList updateDisplay 1', e);
				console.log(e);
			}

		} else {
			// not tabbed
			try {
				let result = '';
				let buttonsBehavior = this.options.buttonsBehavior ?? 'default';
				this.data.forEach((r, ri) => {
					let text = this.options.print(r);
					let buttons = '';
					//let rowid = this.options.rowid(r);
					// ...add id="${this.name}-${rowid}"

					// check options.buttons
					if (this.options.buttons)
						this.options.buttons.forEach((bt, bti) => {
							buttons += `<button type="button" class="btn btn-light btn-sm list-button" data-list-button="${bti}">${bt.text}</button>`;
						});
					
					if (['UL','OL'].includes(this.elements.mainType))
						result += `<li class="list-group-item list-group-item-action`
						+ (buttonsBehavior == 'hidden' ? ' d-flex justify-content-between align-items-start' : '')
						+ `" data-index="${ri}">`
						+ (buttonsBehavior == 'hidden' ? `<div class="ms-2 me-auto">${text}</div>` : text)
						+ buttons + '</li>';
					else
						result += `<div class="list-group-item list-group-item-action`
						+ (buttonsBehavior == 'hidden' ? ' d-flex justify-content-between align-items-start' : '')
						+ `" data-index="${ri}">`
						+ (buttonsBehavior == 'hidden' ? `<div class="ms-2 me-auto">${text}</div>` : text)
						+ buttons + '</div>';
				});
				$(this.elements.main).empty().append(result);

				if (buttonsBehavior == 'hidden')
					$('button.list-button').hide();

				if (this.options.selectable) {
					// on click list element
					$(this.elements.main).children().click((event) => {
						let target = event.target;
						// check if we got a child element by mistake
						// child?
						if (!$(event.target).data('index') && $(event.target.parentNode).data('index'))
							target = event.target.parentNode;
						// grandchild?
						else if (!$(event.target).data('index') && !$(event.target.parentNode).data('index') && $(event.target.parentNode.parentNode).data('index'))
							target = event.target.parentNode.parentNode;

						
						this.selectedIndex = $(target).data('index');

						// deactivate previously selected item
						$(target).siblings().removeClass('active');
						$(target).siblings().attr('aria-current', false);
						if (buttonsBehavior == 'hidden')
							$(target).siblings().children('div .list-button').hide();

						// activate selected item
						$(target).addClass('active');
						$(target).attr('aria-current', true);
						if (buttonsBehavior == 'hidden')
							$(target).children('div .list-button').show();

						if (this.options.onSelect)
							this.options.onSelect(this.getRecord());
					});

					// on click list buttons
					if (this.options.buttons)
						this.options.buttons.forEach((bt, bti) => {
							$(`button.list-button[data-list-button="${bti}"]`).click((event) => {
								bt.onclick($(event.target.parentElement).data('index'));
							});
						});
				}
			} catch(e) {
				alert('arkBSList updateDisplay 2', e);
				console.log(e);
			}	
		}
	}
	
}


export class arkFormCare {
	name;
	options;
	element;
	status;

	constructor(name, options) {
		this.name = name;
		this.options = options;
		
		try {
			// the <form> element itself
			this.element = $(`#form_${name}`);
			if (!this.element)
				throw new Error(`arkFormCare form ${name} not found`);

			// submit button
			this.options.elementBtnSubmit = $(this.element).children("button[id*='submit']");
			this.options.elementBtnSubmit.click(() => {
				this.submit();
			});

			// cancel button
			this.options.elementBtnCancel = $(this.element).children("button[id*='cancel']");
			if (this.options.elementBtnCancel)
				this.options.elementBtnCancel.click(() => {
					this.cancel();
				});
		} catch(e) {
			alert(`Form not found: ${name}`);
		}

		if (typeof this.options.parentElement == 'string')
			this.options.parentElement = $(`#${this.options.parentElement}`);
		
		this.status = '';

		// new record button
		let btnname = (this.options.buttonNew ? this.options.buttonNew : 'btn_new_' + name);
		this.options.elementBtnNew = $(`#${btnname}`);
		if (this.options.elementBtnNew) {
			this.hide();
			this.options.elementBtnNew.click(() => {
				if (!this.status) {
					this.show();
					this.status = 'new';
					this.changeElementsStates();
					if (this.options.beforeNew)
						this.options.beforeNew();
				}
			});
		}

		// edit record button
		btnname = (this.options.buttonEdit ? this.options.buttonEdit : 'btn_edit_' + name);
		this.options.elementBtnEdit = $(`#${btnname}`);
		if (this.options.elementBtnEdit) {
			this.hide();
			this.options.elementBtnEdit.click(() => {
				if (!this.status) {
					this.show();
					this.populateForm();
					this.status = 'edit';
					if (this.options.beforeEdit)
						this.options.beforeEdit();
				}
			});
		}

		return this;
	}

	// change buttons states
	changeElementsStates() {
		// new or edit
		if (this.status == 'new' || this.status == 'edit') {
			if (this.options.buttonNew)
				$(this.options.buttonNew).prop('disabled', true);
			if (this.options.buttonEdit)
				$(this.options.buttonEdit).prop('disabled', true);
		} else if (!this.status) {
			if (this.options.buttonNew)
				$(this.options.buttonNew).prop('disabled', false);
			if (this.options.buttonEdit)
				$(this.options.buttonEdit).prop('disabled', false);
		}
	}

	populateForm() {
		//preencha os campos do form com os dados previamente carregados de um BSDataLoad
		if (this.options.BSDataLoad) {
			let row = this.options.BSDataLoad.getRecord();
			for (let r in row) {
				let el = $(`#${this.name}_${r}`);
				if (el) {
					if (Array.isArray(row[r]))
						el.val( JSON.stringify(row[r]) );
					else
						el.val(row[r]);
				} else
					console.log(`populateForm() not found: #${this.name}_${r}`);
			}
		}
	}

	isPrimaryKey(fieldname) {
		if (this.options.primaryKeys) {
			if (typeof this.options.primaryKeys == 'string')
				return (fieldname == this.options.primaryKeys);
			else
				return this.options.primaryKeys.includes(fieldname);
		} else
			return false;
	}
	
	submit() {
		// checks if form is creating a new record, or editing
		if (this.status != 'new' && this.status != 'edit') {
			console.log(`Form ${this.name} not in edit neither create mode`);
			return;
		}

		let controls = $(`#form_${this.name} :input`);
		let values = {};
		let fieldname;
		for(let c in controls) {
			if (!isNaN(parseInt(c)))
				try {
					if ($(controls[c]) && $(controls[c]).prop
						&& ['INPUT','TEXTAREA','SELECT'].includes($(controls[c]).prop('nodeName'))) {
						//fieldname = $(controls[c]).prop('id').split('_')[1];
						fieldname = $(controls[c]).prop('id').substr( $(controls[c]).prop('id').indexOf('_')+1 );
						if (this.status == 'edit' || !this.isPrimaryKey(fieldname))
							values[ fieldname ] = $(controls[c]).val();
					}
				} catch(e) {
					console.log('arkFormCare submit: error trying to select '+c);
				}
		}

		this.oldStatus = this.status;
		this.status = 'sending';

		console.log(`ajax ${this.options.urlNew} ` + (this.oldStatus == 'new' ? 'POST' : 'PUT'));
		console.log(values);

		$.ajax({
			url: this.options.urlNew,
			method: (this.oldStatus == 'new' ? 'POST' : 'PUT'),
			data: values,
			success: (result) => {
				alert(this.oldStatus == 'new' ? 'New record saved.' : 'Record updated.');
				this.status = '';
				this.hide();
				if (this.options.BSDataLoad)
					this.options.BSDataLoad.update();
				//resolve(result);
			},
			error: (jqXHR, status, thrown) => {
				this.status = this.oldStatus;
				alert(`Failure saving record on form: ${this.name} ${status} (${jqXHR.statusText})`);
			}
		});
	}

	cancel() {
		// checks if form is creating a new record, or editing
		if (this.status == 'sending') {
			console.log(`Form ${this.name} is awaiting for a transaction to end`);
			return;
		}
		if (this.status != 'new' && this.status != 'edit') {
			console.log(`Form ${this.name} not in edit neither create mode`);
			return;
		}

		this.status = '';
		this.hide();
	}

	show() {
		let e, p;
		if (this.options.parentElement) {
			e = this.options.parentElement;
			this.options.parentElement.show();
		} else {
			e = this.element;
			this.element.show();
		}
		p = e.position();
		$(window).scrollTop(p.top);
	}

	hide() {
		if (this.options.parentElement)
			this.options.parentElement.hide();
		else
			this.element.hide();
	}
}
