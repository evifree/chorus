describe("chorus.pages.TagIndexPage", function() {
    beforeEach(function() {
        this.page = new chorus.pages.TagIndexPage();
        this.tagSet = new chorus.collections.TagSet();
    });

    describe("breadcrumbs", function() {
        beforeEach(function() {
            this.page.render();
        });

        it("displays the Tags breadcrumb", function() {
            expect(this.page.$('.breadcrumbs')).toContainTranslation("breadcrumbs.home");
            expect(this.page.$('.breadcrumbs')).toContainTranslation("breadcrumbs.tags");
        });
    });

    describe("page title", function() {
        beforeEach(function() {
            this.page.render();
        });

        it("is 'Tags'", function() {
            expect(this.page.$('h1[title=Tags]')).toContainTranslation("tags.title_plural");
        });
    });

    describe("content details", function() {
        beforeEach(function() {
            this.tags = [{ name: "IamTag"}, { name: "IamAlsoTag" }];
            this.server.completeFetchAllFor(this.tagSet, this.tags);
            this.page.render();
        });

        it("loads the correct count", function() {
            expect(this.page.$('.count')).toContainText(this.tags.length);
        });
    });

    describe("content", function() {
        beforeEach(function() {
            this.tags = [{ name: "IamTag"}, { name: "IamAlsoTag" }];
            this.server.completeFetchAllFor(this.tagSet, this.tags);
            this.page.render();
        });

        it("loads the tags", function() {
            _.each(this.tags, function(tag) {
                expect(this.page.$('.content')).toContainText(tag.name);
            }, this);
        });
    });

    describe("sidebar", function() {
        beforeEach(function() {
            this.tags = [{ name: "IamTag"}, { name: "IamAlsoTag" }];
            this.server.completeFetchAllFor(this.tagSet, this.tags);
            this.page.render();
        });

        it("selects the first tag and shows it on the sidebar", function() {
            expect(this.page.$('.tag_title')).toContainText("IamTag");
        });
    });
});
