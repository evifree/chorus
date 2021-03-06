#!/bin/bash

if [[ -z "$RAILS_ENV" ]]; then
  export RAILS_ENV=test
fi

export GPDB_HOST=chorus-gpdb42
export HADOOP_HOST=chorus-gphd02

set -e

. script/ci/setup.sh

targets=${@}
possible_targets="fixtures jasmine ruby legacy_migration api_docs"

for target in $possible_targets; do
    declare run_${target}=true
done

if [[ "$targets" ]]; then
    for target in $possible_targets; do
        declare run_${target}=false
    done
    for target in $targets; do
        for possible_target in $possible_targets; do
           if [[ "$target" == "$possible_target" ]] ; then
                declare run_${target}=true
           fi
        done
    done
fi

if $run_ruby; then
    echo "starting gpfdist (Linux RHEL5 only)"
    export LD_LIBRARY_PATH=vendor/gpfdist-rhel5/lib:${LD_LIBRARY_PATH}
    ./vendor/gpfdist-rhel5/bin/gpfdist -p 8000 -d /tmp &
    ./vendor/gpfdist-rhel5/bin/gpfdist -p 8001 -d /tmp &
fi

# start jasmine
if $run_jasmine ; then
    rm -fr tmp/cache
    b/rake jshint:all
    b/rake jasmine > $WORKSPACE/jasmine.log 2>&1 &
    jasmine_pid=$!
    echo "Jasmine process id is : $jasmine_pid"
    echo $jasmine_pid > tmp/pids/jasmine-$RAILS_ENV.pid
    sleep 30
    kill -CONT $jasmine_pid
fi

set +e

if $run_ruby ; then
    echo "Running unit tests"
    ln -sf .rspec-ci .rspec
    b/rake -f `bundle show ci_reporter`/stub.rake ci:setup:rspec spec 2>&1
    RUBY_TESTS_RESULT=$?
    run_fixtures=false
else
    RUBY_TESTS_RESULT=0
fi

if $run_fixtures ; then
    echo "Building fixtures"
    ln -sf .rspec-ci .rspec
    b/rake jasmine:fixtures 2>&1
    FIXTURES_RESULT=$?
else
    FIXTURES_RESULT=0
fi

if $run_jasmine ; then
    echo "Running javascript tests"
    loaded=1
    while [ $loaded -ne 0 ]
    do
        filter=youll_never_find_me b/rake phantom | grep -v -e '^Phantom callbacks not attached in time'
        loaded=$?
    done
    b/rake phantom 2>&1
    JS_TESTS_RESULT=$?
    echo "Cleaning up jasmine process $jasmine_pid"
    kill -s SIGTERM $jasmine_pid
else
    JS_TESTS_RESULT=0
fi

if $run_ruby ; then
    echo "Cleaning up gpfdist"
    killall gpfdist
fi

if $run_legacy_migration; then
    echo "Running legacy migration tests"
    b/rake db:drop db:create db:migrate
    CI_REPORTS=spec/legacy_migration/reports b/rake -f `bundle show ci_reporter`/stub.rake ci:setup:rspec spec:legacy_migration --trace
    LEGACY_MIGRATION_TESTS_RESULT=$?
else
    LEGACY_MIGRATION_TESTS_RESULT=0
fi

if $run_api_docs ; then
    echo "Running API docs check"
    b/rake api_docs:check
    API_DOCS_CHECK_RESULT=$?
else
    API_DOCS_CHECK_RESULT=0
fi

if $run_ruby ; then
    echo "RSpec exit code: $RUBY_TESTS_RESULT"
fi

if $run_jasmine ; then
    echo "Jasmine exit code: $JS_TESTS_RESULT"
fi

if $run_legacy_migration ; then
    echo "Legacy migration exit code: $LEGACY_MIGRATION_TESTS_RESULT"
fi

if $run_api_docs ; then
    echo "API docs check exit code: $API_DOCS_CHECK_RESULT"
fi

SUCCESS=`expr $RUBY_TESTS_RESULT + $FIXTURES_RESULT + $JS_TESTS_RESULT + $LEGACY_MIGRATION_TESTS_RESULT + $API_DOCS_CHECK_RESULT`
exit $SUCCESS
