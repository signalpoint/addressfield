function _addressfield_localstorage_check(options) {
  var result = _addressfield_localstorage_load(options);
  return result && _addressfield_localstorage_resolve(result, options);
}

function _addressfield_localstorage_key(options) {
  switch (options.resource) {
    case 'country_get_list': return 'addressfield_' + options.resource; break;
    case 'get_address_format':
    case 'get_administrative_areas':
    case 'get_address_format_and_administrative_areas':
        if (options.data) {
          var data = JSON.parse(options.data);
          var key = 'addressfield_' + options.resource;
          if (data.country_code) { key += '_' + data.country_code; }
          return key;
        }
      break;
  }
  return options.path;
}

function _addressfield_localstorage_load(options) {
  var result = window.localStorage.getItem(_addressfield_localstorage_key(options));
  return result ? JSON.parse(result) : null;
}

function _addressfield_localstorage_resolve(result, options) {
  if (options.success) {
    options.success(result);
    module_invoke_all('addressfield_local_storage_resolve', result, options);
    return true;
  }
  return false;
}

function _addressfield_localstorage_save(options, result) {
  window.localStorage.setItem(_addressfield_localstorage_key(options), JSON.stringify(result));
}
