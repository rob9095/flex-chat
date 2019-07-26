const mongoose = require('mongoose');

const shiftSchema = new mongoose.Schema({
		user: {
			type: mongoose.Schema.Types.ObjectId,
			ref: 'User',
			required: true,
		},
		warehouse: {
			type: String,
			required: true,
    },
    status: {
      type: String,
      required: true,
    },
    startTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      required: true,
    },
    createdOn: {
      type: Date,
			default: Date.now(),
    },
	},
	{
		timestamps: true
  },
  { toJSON: { virtuals: true } });

shiftSchema.virtual('shiftKey').get(function () {
  return `${this.warehouse}-${this.startTime}`
})

const Shift = mongoose.model('Shift', shiftSchema);
module.exports = Shift;
