chorus.views.DatabaseListSidebar = chorus.views.Sidebar.extend({
    className: "database_list_sidebar",

    setup: function() {
        chorus.PageEvents.subscribe("database:selected", this.setDatabase, this);
    },

    setDatabase: function(database) {
        this.resource = database;
        this.render();
    }
});