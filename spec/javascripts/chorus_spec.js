describe("chorus", function() {
    beforeEach(function() {
        this.chorus = new Chorus();
        this.backboneSpy = spyOn(Backbone.history, "start")
    })

    describe("#initialize", function() {
        it("should start the Backbone history after the session has been set", function() {
            var self = this;
            expect(this.chorus.session).toBeUndefined();
            this.backboneSpy.andCallFake(function() {
                expect(self.chorus.session).toBeDefined();
            });
            this.chorus.initialize()
            expect(Backbone.history.start).toHaveBeenCalled();
        });

        it("should create a session", function() {
            this.chorus.initialize()
            expect(this.chorus.session).toBeDefined();
        });
    });

    describe("#toast", function() {
        beforeEach(function() {
            spyOn($, 'jGrowl');
        });

        it("accepts a translation string", function() {
            chorus.toast("test.deer");
            expect($.jGrowl).toHaveBeenCalledWith("Deer", {life: 5000, sticky: false});
        });

        it("accepts a translation string with arguments", function() {
            chorus.toast("test.with_param", {param : "Dennis"});
            expect($.jGrowl).toHaveBeenCalledWith("Dennis says hi", {life: 5000, sticky: false});
        });

        it("accepts toastOpts in the options hash", function() {
            chorus.toast("test.with_param", { param: "Nobody", toastOpts : {sticky : true, foo: "bar"}});
            expect($.jGrowl).toHaveBeenCalledWith("Nobody says hi", {life: 5000, sticky: true, foo: "bar"});
        });
    });

    describe("fileIconUrl", function() {
        function verifyUrl(fileType, fileName) {
            expect(chorus.urlHelpers.fileIconUrl(fileType)).toBe("/images/workfiles/large/" + fileName + ".png");
        }

        it("maps known fileTypes to URLs correctly", function() {
            verifyUrl("C", "c");
            verifyUrl("c++", "cpp");
            verifyUrl("cc", "cpp");
            verifyUrl("cxx", "cpp");
            verifyUrl("cpp", "cpp");
            verifyUrl("csv", "csv");
            verifyUrl("doc", "doc");
            verifyUrl("excel", "xls");
            verifyUrl("h", "c");
            verifyUrl("hpp", "cpp");
            verifyUrl("hxx", "cpp");
            verifyUrl("jar", "jar");
            verifyUrl("java", "java");
            verifyUrl("pdf", "pdf");
            verifyUrl("ppt", "ppt");
            verifyUrl("r", "r");
            verifyUrl("rtf", "rtf");
            verifyUrl("sql", "sql");
            verifyUrl("txt", "txt");
            verifyUrl("docx", "doc");
            verifyUrl("xls", "xls");
            verifyUrl("xlsx", "xls");
        });

        it("maps unknown fileTypes to plain.png", function() {
            verifyUrl("foobar", "plain");
            verifyUrl("N/A", "plain");
        });

        it("defaults to large size", function() {
            expect(chorus.urlHelpers.fileIconUrl("C")).toBe("/images/workfiles/large/c.png");
        })

        it("takes an optional size override", function() {
            expect(chorus.urlHelpers.fileIconUrl("C", "medium")).toBe("/images/workfiles/medium/c.png");
        })

        it("returns 'plain' when null is passed", function() {
            verifyUrl(undefined, "plain");
        });
    });
});
