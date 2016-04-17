Chart.types.Line.extend({
    name: "line",
    initialize: function (data) {
        Chart.types.Line.prototype.initialize.apply(this, arguments);
        var xLabels = this.scale.xLabels
        xLabels.forEach(function (label, i) {
            if (i % 2 == 1)
                xLabels[i] = '';
        })
    }
});
