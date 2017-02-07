/**
 * Implements hook_field_widget_form().
 */
function addressfield_field_widget_form(form, form_state, field, instance, langcode, items, delta, element) {
  try {
    // @see https://www.drupal.org/node/1933438
    //console.log(form);
    //console.log(field);
    //console.log(instance);
    //console.log(items[delta]);

    // @TODO we need more unique ids because the node add form vs the node edit
    // form has colliding ids when first editing a node, then creating a node
    // later, the latter form will inherit the country code from the prior.

    // Is this a new or existing entity?
    _address_field_new_entity = form.arguments.length && form.arguments[0][entity_primary_key(form.entity_type)] ? false : true;

    // Extract the countries. If it's an array and empty, that means every
    // country is allowed and we'll need to grab them from the server. If it's
    // an object, then only the countries listed within the object are valid,
    // and they are listed only as country codes as the property name and value.
    var countries = instance.widget.settings.available_countries;
    var country_widget_id = items[delta].id + '-country';

    // How many available countries are there?
    var country_count = 0; // we'll default to all countries, aka zero
    for (var country_code in countries) {
      if (!countries.hasOwnProperty(country_code)) { continue; }
      var country = countries[country_code];
      country_count++;
    }

    // If we're editing an existing value, set it aside so we can populate its
    // values into the widget later.
    if (items[delta].item) {
      if (typeof _address_field_items[field.field_name] === 'undefined') {
        _address_field_items[field.field_name] = [];
      }
      _address_field_items[field.field_name].push({
        id: items[delta].id,
        item: items[delta].item
      });
    }

    // What's the default country? An empty string means "none", otherwise it
    // will be the country code, or site_default. If it was an empty string,
    // and there is only one country available, use it.
    // @TODO - properly handle the site_default country. This will probably need
    // to be delivered via drupalgap system connect and made available to the
    // SDK.
    var default_country = instance.widget.settings.default_country;
    if (default_country == 'site_default') { default_country = 'US'; }
    else if (empty(default_country) && country_count == 1) {
      for (var country_code in countries) {
        if (!countries.hasOwnProperty(country_code)) { continue; }
        default_country = countries[country_code];
        break;
      }
    }

    // Prepare the child widget. If there is no default country, and this field
    // is optional add an empty option for '- None -'.
    var child = {
      type: 'select',
      title: 'Country',
      options: {},
      attributes: {
        id: country_widget_id,
        onchange: "_addressfield_field_widget_form_country_onchange(this, " +
        "'" + items[delta].id + "'," +
        delta + "," +
        "'" + field.field_name + "'" +
        ")"
      }
    };
    if (form.entity_type) { child.attributes.entity_type = form.entity_type; }
    if (form.bundle) { child.attributes.bundle = form.bundle; }
    if (empty(default_country) && !instance.required) {
      child.options[''] = '- None -';
    }

    // What countries are allowed?
    if ($.isArray(countries) && countries.length == 0) {

      // All countries allowed.
      child.suffix = drupalgap_jqm_page_event_script_code({
        page_id: drupalgap_get_page_id(),
        jqm_page_event: 'pageshow',
        jqm_page_event_callback: '_addressfield_field_widget_form_country_pageshow',
        jqm_page_event_args: JSON.stringify({
          country_widget_id: country_widget_id,
          delta: delta,
          field_name: field.field_name,
          default_country: default_country,
          required: instance.required
        })
      });

    }
    else {

      // Only certain countries are allowed, add them as options.
      // @TODO - display the country name instead of the code.
      $.each(countries, function(code, value) {
        child.options[code] = value;
      });

      // If there was an item or no default country, manually trigger the
      // onchange event for that particular country.
      if (items[delta].item || !empty(default_country)) {
        var country_code = items[delta].item ? items[delta].item.country : default_country;
        child.suffix = drupalgap_jqm_page_event_script_code({
          page_id: drupalgap_get_page_id(),
          jqm_page_event: 'pageshow',
          jqm_page_event_callback: '_addressfield_field_widget_default_country_pageshow',
          jqm_page_event_args: JSON.stringify({
            country_widget_id: country_widget_id,
            default_country: country_code
          })
        });
      }

    }

    // Finally push the child onto the element and place an empty container for
    // the country's widget to be injected dynamically.
    items[delta].children.push(child);
    items[delta].children.push({
      markup: '<div id="' + country_widget_id + '-widget"></div>'
    });

  }
  catch (error) { console.log('addressfield_field_widget_form - ' + error); }
}

/**
 *
 */
function _addressfield_field_widget_form_country_pageshow(options) {
  try {
    addressfield_country_get_list({
      success: function(countries) {

        // Add each country to the drop down.
        var html = '';
        $.each(countries, function(code, name) {
          html += '<option value="' + code + '">' + name + '</option>';
        });
        if (!empty(html)) {
          $('#' + options.country_widget_id).append(html);
        }

        // If we have an existing country, change the value of the widget to
        // that country.
        if (
            typeof _address_field_items[options.field_name] !== 'undefined' &&
            typeof _address_field_items[options.field_name][parseInt(options.delta)] !== 'undefined'
        ) {
          setTimeout(function () {
            var item = _address_field_items[options.field_name][parseInt(options.delta)].item;
            var select = $('#' + options.country_widget_id);
            select.val(item.country).selectmenu('refresh', true).change();
          }, 1);
        }

        // We didn't have an existing country, but if we have a default
        // country use it and fire the change event for the country select.
        else if (!empty(options.default_country)) {
          setTimeout(function () {
            $('#' + options.country_widget_id).val(options.default_country).selectmenu('refresh', true).change();
          }, 1);
        }

        // We don't have an existing country, and we don't have a default
        // country, so if this field is required immediately trigger the
        // change event on the first available country.
        else if (empty(options.default_country) && options.required) {
          setTimeout(function () {
            $('#' + options.country_widget_id).selectmenu('refresh', true).change();
          }, 1);
        }

      }
    });
  }
  catch (error) { console.log('_addressfield_field_widget_form_country_pageshow - ' + error); }
}

/**
 * Used to manually trigger the country widget's change event.
 */
function _addressfield_field_widget_default_country_pageshow(options) {
  try {
    $('#' + options.country_widget_id).val(options.default_country).change();
  }
  catch (error) { console.log('_addressfield_field_widget_default_country_pageshow - ' + error); }
}

/**
 * A form state value callback.
 */
function addressfield_field_value_callback(id, element) {
  try {
    var values = [];
    var widgets = addressfield_get_components();
    for (var index in widgets) {
      if (!widgets.hasOwnProperty(index)) { continue; }
      var widget = widgets[index];
      var widget_id = id + '-' + widget;
      var val = $('#' + widget_id).val();
      if (typeof val !== 'undefined') { values.push(val); }
    }
    if (values.length == 0 || (values.length == 1 && empty(values[0]))) { return null; }
    if (element.is_field) { return values.join(','); }
    else {
      var result = {};
      var widgets = addressfield_get_components();
      $.each(widgets, function(index, widget) {
        var widget_id = element.id + '-' + widget;
        result[widget] = $('#' + widget_id).val();
      });
      return result;
    }

  }
  catch (error) { console.log('addressfield_field_value_callback - ' + error); }
}
