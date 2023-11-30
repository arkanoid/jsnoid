# class arkBSDataLoad

Client side base class for loading data through AJAX (or a callback function), keeping that data, then displaying it through Bootstrap (BS) components.
Don't use this class directly, instead use one of the child classes (currently arkBSList and arkBSCard).

## constructor (name, dataSource, options)
* **name** (_string_): Name identifier for this control. 
Upon creating the object it will locate a HTML element with id equal to this name. See the example HTML above.
* **dataSource** (_string, object or function_): Where to obtain the data from. It is expected the data comes in the format a Knex query will return, be it several records or a single record. The 3 possible types are:
	* string: an URL to be called trough AJAX (with GET)
	* object: also data for an AJAX call, in this form: `{ url: '...', method: 'POST' /* or GET */ }`
	* function: A callback that should return the data.
* **options** (_optional object_): Holds several additional options.
	* **filterForm** (_optional string_): ID of a `<form>` element with fields to filter the data. The fields will be passed as parameters to the AJAX query and are meant to be interpreted by the server as filters. We suggest the format 'form_filter_samenameidentifier'.
	The form must have a single `<button>` element which will be used to submit the filter (thus reloading the data). The filled fields will have their values collected and passed in the URL as query parameters (in the format `?field1=value1&field2=value2`).

## update(urlFilterQuery)
Reloads the data (calls `reloadDataSource()`) then updates the view (calls `updateDisplay()`).

* **urlFilterQuery** (_optional string_): String in the format 'param1=value1&param2=value2&...' (without the leading '?'). If specified, will be passed to reloadDataSource(). Usually this string is constructed based on a filterForm, if specified. But it's here if you need to pass a specific query.


# class arkBSCard

Descends from arkBSDataLoad. The data will be displayed in a Bootstrap (BS) Card.
To be used client side.


## Example HTML

Something like the code below is expected to be found in the page.
```HTML
<div class="card" id="myname">

	<!-- You can use the image feature, if you want. Not used by arkBSCard -->
	<img src="..." class="card-img-top" alt="...">
	
	<!-- card-body can be used to display a single record, or selected info. Or for a search form. -->
	<div class="card-body"></div>

	<!-- In place of a card-body element, you can also use a card-img-overlay. (this does *not* prevent you from adding more card-body elements, as below) -->
	<!-- note: if used, the <img> element above should be of class card-img instead of card-img-top -->
	<div class="card-img-overlay"></div>

	<!-- One list-group, if present, will be used to display several records. -->
	<ul class="list-group list-group-flush"></ul>

	<!-- another card-body can be added, if you need to display more info on the same card. -->
	<div class="card-body"></div>
</div>
```

## constructor (name, dataSource, options)
Same as arkBSDataLoad. The differences/additions are listed below.

As indicated in the Example HTML above, the card can have the following parts:
* card-body: The card can actually have several of these. Only the first one will be targeted by main functions.
* list-group: If present it will be used to display several records.
* card-img-overlay: If present it will be used as the first of the card-bodys.

* **options** (_optional object_): Holds some additional options.
	* **list** (_optional function_): Callback function, will receive an entire record and must return the 'printable' form. The output will be show in the list part of the card, if there is one.
	* **body** (_optional function_): Callback function, will receive an entire record and must return the 'printable' form to be shown in the first card-body (or card-img-overlay). Only one record will be shown. The second parameter passed to the function will be which card-body is being filled; if `null` then it's the main body. Other bodies will receive a number starting from 0.
	* **imgsrc** (_optional function or string_): This option will be used if there is an `<img>` element in the card. If string, the value will be used only once at start to fill the `src` attribute. If a function, it will be called with the record as parameter when the *body* callback function is called. The return value will be inserted in the `src` attribute.



# class arkBSList

Descends from arkBSDataLoad. The data will be displayed in a Bootstrap (BS) List, an `<ul>`, `<ol>`, or `<div>` element.
To be used client side.

## Example HTML
```HTML
<ul id="myname" class="list-group"></ul>
<!-- example if using tabbed option (see below) -->
<div id="myname" class="row">
	<div class="col-md-6 col-sm-12"></div>
	<div class="col-md-6 col-sm-12"></div>
</div>
```

## constructor (name, dataSource, options)
Same as arkBSDataLoad. The differences/additions are listed below.

* **options** (_optional object_): Holds several additional options.
	* **tabbed** (_optional boolean_): If true the list will be used as tabs for a content area. If this option is used then a `<div>` must be used, and have two other `<div>`s nested inside (see section Example HTML above). The first `<div>` will hold the tabs list and the second one the content area.
	* **print** (_function_): Callback function, will receive an entire record and must return the 'printable' form. The output will be show in the list item.
	* **selectable** (_optional boolean_): If true the list items can be selected. Only one item can be selected at a time. Note: if **tabbed** is used the list will automatically be selectable, so no need to also specify this option if **tabbed** is already used.
	* **onSelect** (_optional function_): This callback function will be called whenever an item is selected (clicked). The parameter passed is the record data that's stored.
	* **rowid** (_optional function_): This callback function receives the record data and must return which primary key is associated with the data. Usually the function will be in the format `(x) => { return x.id; }`. Note: if **tabbed** is used then this option must also be specified.
	* **buttons** (_optional array_): List of buttons to add to the list element. Each array element is an object with the following fields:
		* **text** (string): Button text.
		* **onclick** (function): Callback function. Will receive as argument the result of **rowid** property.
	* **buttonsBehavior** (_optional string_): Control the behavior of the above **buttons**. Values can be:
		* 'default': No different behavior.
		* 'hidden': Buttons are hidden by default and only shown when the element list is selected.


# class arkFormCare

Manages a form. Used to collect data from the form and send to ajax.

What the form must have:
* id property in the format `form_myname`, where _myname_ is the name passed to the constructor.
* Its fields' id should follow the format: `myname_myfield`, where _myname_ is the same as above, and _myfield_ is the field name. When submitting data, the fields' values will be collected in an object using _myfield_ as the key of each field.
* The submit button must be actually `type="button"`, but have an id of the format `submit_myname` (actually any id which name begins with _submit_ will be used). Must be inside the form.
* Similarly a button named `cancel_myname` will be used accordingly, if found.

## constructor (name, options)

* **name** (_string_): Form name. The HTML element &lt;form$gt; is expected to have an id of 'form_name'. Ex: `<form id="form_users">`, the name is 'users'.

It's also expected to be used as a **prefix** for every form field. All fields inside this form must have a name in the format 'formname_fieldname', where _fieldname_ must be a key in the data dictionary.

The constructor will look for a button named 'btn_new_formname' (anywhere in the page). If one is found, the form will be hidden on page load, and displayed when this button is clicked. If an option `buttonNew` is passed, its name will be used instead. The same works for editing records, the option being `buttonEdit` and default name 'btn_edit_formname'.

* **options** (_object_): Several options.
	* **BSDataLoad** (_optional object_): an object from arkBSDataLoad class, like arkBSCard or arkBSList. If specified certain actions will synchronize with it; for example, after the form finishes saving, the BSDataLoad will reload its data.
	* **urlNew** (_optional string_): Address for a POST ajax access. Used when the form is used to create a new record.
	* **parentElement** (_optional string or object_): Parent element containing the form. If specified, actions that affect the entire form (like hide() and show()) will also apply to the parent. If string, it's the HTML id; if object it's a jQuery.
	* **buttonNew** (_optional string_): ID of a button element that will be used to put the form into 'new' state (create new record). If not specified, a button named 'btn_new_formname' will be looked for instead.
	* **buttonEdit** (_optional string_): Same as above but for editing records. The default name is 'btn_edit_formname'.
	* **primaryKeys** (_optional string or array_): List of fields that are primary keys to the data. When in **edit** mode, those fields will be kept in the data being sent through ajax. When in **new** mode these fields will be removed from data before send.
	* **beforeNew** (_optional function_): Called before the form is shown to fill a new record.
	* **beforeEdit** (_optional function_): Called before the form is shown to edit a record.
