/*
 * client side
 */
const _arkBSDataLoad = new Map();

export class arkBSDataLoad {
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
