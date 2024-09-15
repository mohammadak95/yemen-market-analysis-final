import React from 'react';

const Checkbox = ({ checked, onCheckedChange, id, label }) => {
  return (
    <div className="flex items-center">
      <input
        id={id}
        type="checkbox"
        checked={checked}
        onChange={e => onCheckedChange(e.target.checked)}
        className="h-4 w-4 text-blue-600 bg-gray-800 border-gray-600 focus:ring-blue-500 rounded"
      />
      {label && (
        <label htmlFor={id} className="ml-2 text-sm text-gray-200">
          {label}
        </label>
      )}
    </div>
  );
};

export default Checkbox;