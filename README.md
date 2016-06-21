addressfield
============

The Address Field module for DrupalGap. For usage, install the following module
on your Drupal site, and follow it's README.txt file:

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
