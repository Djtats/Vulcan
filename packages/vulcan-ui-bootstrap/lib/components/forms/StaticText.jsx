import React from 'react';
import { registerComponent } from 'meteor/vulcan:core';

const StaticComponent = ({ value, label }) => (
  <div className="form-group row">
    <label className="control-label col-sm-3">{label}</label>
    <div className="col-sm-9">{value}</div>
  </div>
);

registerComponent('FormComponentStaticText', StaticComponent);
