addressfield
============

The Address Field module for DrupalGap. For usage, install the following module
on your Drupal site, and follow it's [README.txt](http://cgit.drupalcode.org/services_addressfield/tree/README.txt) on its project homepage:

https://www.drupal.org/project/services_addressfield

## Form Element

This module automatically supports address field widgets on entities and bundles. But if you'd like to place a generic
address field form element on a custom form, that is also possible like so:

```
form.elements['my-addressfield'] = {
  type: 'addressfield_form_element',
  title: t('Name and Location'),
  default_country: 'US',
  required: true,
  value_callback: 'addressfield_field_value_callback'
};
```

### Injecting existing values into form element
It's a little tricky to get existing address field entity values into one of these elements. To do it, post process an address field service call when viewing your form, then use the injection helper function like so:
```
/**
 * Implements hook_services_postprocess()
 */
function my_module_services_postprocess(options, result) {
  if (options.service == 'services_addressfield' &&
      options.resource == 'get_address_format_and_administrative_areas') {
    switch (drupalgap_router_path_get()) {
      case 'my-link-router-pathy':
        addressfield_inject_components(
            'my_custom_form',
            'my-addressfield',
            Drupal.user.field_address.und ? Drupal.user.field_address.und[0] : null
        );
        break;
    }
  }
}
```
