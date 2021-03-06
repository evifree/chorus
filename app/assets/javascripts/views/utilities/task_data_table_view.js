chorus.views.TaskDataTable = chorus.views.Base.extend({
    templateName: "data_table",
    constructorName: "TaskDataTable",

    events: {
        "click a.move_to_first": "moveColumnToFirst"
    },

    // backbone events don't work for scroll?!
    postRender: function() {
        this.$(".tbody").bind("scroll", _.bind(this.adjustHeaderPosition, this));
        this.$("a.move_to_first").qtip({
            content: {
                text: t("results_console_view.data_table.move_to_first_column")
            },
            hide: 'mouseleave click',
            style: {
                classes: "tooltip-help",
                tip: {
                    width: 12,
                    height: 12
                }
            },
            position: {
                my: "bottom center",
                at: "top center",
                container: this.el
            }
        });

        this.setupScrolling(".tbody");
    },

    additionalContext: function() {
        return {
            shuttle: this.options.shuttle === undefined || this.options.shuttle,
            columns: this.model.columnOrientedData()
        };
    },

    adjustHeaderPosition: function() {
        this.$(".thead").css({ "left": -this.scrollLeft() });
    },

    scrollLeft: function() {
        var api = this.$(".tbody").data("jsp");
        return api && api.getContentPositionX();
    },

    moveColumnToFirst: function(e) {
        e.preventDefault();

        var $th = $(e.currentTarget).closest(".th");
        var $thead = this.$(".thead");
        var $tbody = this.$(".column:first").parent();
        var index = $thead.find(".th").index($th);

        $thead.prepend($th);
        $tbody.prepend(this.$(".column").eq(index));
    }
});