/**
 * Implements hook_field_formatter_view().
 */
function addressfield_field_formatter_view(entity_type, entity, field, instance, langcode, items, display) {
  try {
    var element = {};
    $.each(items, function(delta, item) {
      element[delta] = {
        markup: theme('addressfield', item)
      };
    });
    return element;
  }
  catch (error) { console.log('addressfield_field_formatter_view - ' + error); }
}
