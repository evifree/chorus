#Greenplum Chorusrails

This file contains instructions to get started on Mac OSX.  If you are running Linux, it shouldn't be too different.

##Bootstrap

Install homebrew

  /usr/bin/ruby -e "$(curl -fsSL https://raw.github.com/mxcl/homebrew/master/Library/Contributions/install_homebrew.rb)"

You need git

    brew install git

Get someone who has rights to the repository to add your github account to the repo.
Check that you can get to Github correctly:

    ssh git@github.com
The response should have your username in it.  If it doesn't go to http://help.github.com/ssh-issues/

Check out the repo in `~/workspace/chorusrails`, like so:

    git clone git@github.com:GreenplumChorus/chorusrails.git ~/workspace/chorusrails

###Postgres

Install postgres if you don't have it

    brew install postgres

You may have to increase some memory limits:

    sudo sysctl -w kern.sysv.shmall=65536
    sudo sysctl -w kern.sysv.shmmax=16777216

You can put these settings in your `/etc/sysctl.conf` file, and they will become effective whenever you boot:

    kern.sysv.shmall=65536
    kern.sysv.shmmax=16777216

If you don't have a `/etc/sysctl.conf` file, just create one.

OSX Lion may not retain these settings between reboots, so you may see the message
could not create shared memory segment: Invalid argument` indicating that the `sysctl` commands need to be run again.

### XCode

You need XCode for a compiler

### Install ruby

#### If you are currently using RVM, remove it.

Mostly, you need to run

    rvm implode

You should also remove any references to RVM in your bash setup.  As a start, run...

    grep -i rvm ~/.bash* | grep -v .bash_history

Which will list files that reference RVM.  Edit those files to remove rvm completely.

Note that this will break RVM in other systems, notably the chorus-java project.  See the README in the chorus-java project for the new way to install Ruby.

Start a new terminal.

#### Run script/bootstrap

From the root directory of this project, run:

    script/bootstrap.sh
    
Note: Ignore all db errors for now.

This script

* Installs rbenv
* Installs ruby (at the version found in .rbenv-version)
* Installs bundler
* Installs gems
* Creates databases
* Runs tests

For Macs only:
brew install qt

## Development

    cd ~/workspace/chorusrails && foreman start
    If foreman fails to start run:
    bundle  

    In another terminal window, run: 
	cd ~/workspace/chorusrails && script/start_db.sh (or script/start_db_noisy.sh for verbouse db output.)
   
    Run the following rake commands, ignore DB errors.
    rake db:migrate
    rake db:test:prepare

Application will be on http://localhost:3000

    If you cannot log in as edcadmin, you first need to initialize the it in the database with

    rake db:seed

## HDFS Service
	To be able to connect to HDFS you need to run:
	script/start_hdfs_service.sh
	
### Testing:

    script/test

#### Re-creating the database:

When the database has incoherent data (i.e. a suspicious amount of tests fails even though you didn't change much) you can re-create the database.

1. Stop foreman by pressing Ctrl-C in the foreman terminal    
2. Run script/reset_db.sh
3. (If you get an error saying the database isn't online, run script/start_db.sh)
4. Restart foreman by running 'foreman start' in the foreman window (chorusrails root)

### CI

http://greenplum-ci:3333/builds/chorusrails

Delete all gems
'gem list | cut -d" " -f1 | xargs gem uninstall -aIx'
