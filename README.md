# GPX Splitting Tool

[![license](https://img.shields.io/github/license/dlvoy/gpxsplit.svg)](https://github.com/dlvoy/gpxsplit/blob/master/LICENSE)
[![NPM version](http://img.shields.io/npm/v/gpxsplit.svg?style=flat)](https://www.npmjs.com/package/gpxsplit)
[![Build Status](https://img.shields.io/travis/dlvoy/gpxsplit.svg?style=flat)](https://travis-ci.org/dlvoy/gpxsplit)
[![Dependencies Status](http://img.shields.io/david/dlvoy/gpxsplit.svg?style=flat)](https://david-dm.org/dlvoy/gpxsplit)

**gpxsplit** is command line tool to split and convert GPX files.

GPX is handy, de-facto standard file format used by GPS devices and mapping software.
But some legacy GPS devices are limited in way they support tracks, especially longer ones.
This tool  convert and split GPX files. It make possible to use modern GPX files,
like those exported from on line routing sites to handle them on older, legacy GPS hardware.

## Setup

* install [Node.JS](https://nodejs.org) (if not already installed)
* from command line execute:

```sh
$ npm install -g gpxsplit 
``` 

## Usage

```sh
$ gpxsplit [options] [path_to_gpx_file]
``` 

For full list of supported options execute:
```sh
$ gpxsplit -h
``` 

## Options

All options are *optional*. When not specified, they are *ignored* or have *default value*.
Boolean options are *true* if flag is present, *false* otherwise.

Option                                   | Type        | Default value
---                                      | :---:       | ---       
[`-h`, `--help`](#option-help)           | `Boolean`   |
[`-V`, `--version`](#option-version)     | `Boolean`   |
[`-s`, `--split`](#option-split)         | `Integer`   | 500
[`-w`, `--waypoints`](#option-waypoints) | `Integer`   | 10
[`-o`, `--output`](#option-output)       | `File Path` | auto generated
[`-b`, `--backup`](#option-backup)       | `Boolean`   | 
[`-d`, `--decimals`](#option-decimals)   | `Integer` [3..7] | 6
[`-p`, `--postfix`](#option-postfix)     | `String`    | -split
[`--noNameFix`](#option-no-name-fix)     | `Boolean`   | 
[`--noSplit`](#option-no-split)          | `Boolean`   | 
[`--noWaypoints`](#option-no-waypoints)  | `Boolean`   | 

### Option help

Displays all options with short description.

### Option version

Displays version of application (match NPM/Git version number).

### Option split

Maximal allowed count of points in track. 
If track have more points, it will be split into parts. Each part points count is configured by this parameter.

Track parts shares all attributes of original path, with few notable changes:
* track label and name are updated (or added - if not present), with number of part appended to it's end.
* if resulting name is longer than 13 characters - original name will be shortened to fit into 13 character limit. This behaviour can be disabled by adding [`--noNameFix`](#option-no-name-fix) option

If parameter is 0, track will be not split, same as when adding [`--noSplit`](#option-no-split).

### Option waypoints

Adds waypoints (POIs) each specified amount of kilometers.
If parameter is 0, no waypoints are generated, same as when adding [`--noNameFix`](#option-no-waypoints).

### Option output

Explicit specifies output file.
If not given, original file name is used, together with option [`-p`, `--postfix`](#option-postfix), to generate output name.
__If output file exists it will be overwritten__

### Option backup

If given, this option triggers making copy of source GPX file, saved into file with appended *.bak* extension.
Previous *.bak* file (old backup) will be overwritten.

### Option decimals

Specify amount of significant [decimal places for GPS coordinates](https://en.wikipedia.org/wiki/Decimal_degrees).
Should be value between **3** and **7**, default **6** is usually best choice.

### Option postfix

Decides postfix added to source GPX file name to generate default output GPX file name.
If source file name is already postfixed with given postfix, file will be backed-up and overwritten.

### Option no name fix

By default, while splitting tracks, resulting track name is shortened to fit into 13 characters limit - as it is required by some older GPS devices.
But when this flag is present, __name is not adjusted__.

### Option no split

By default, tracks having more point than threshold specified by [`-s`, `--split`](#option-split) , are divided into parts. 
But when this flag is present, __tracks are not split or adjusted__.

### Option no waypoints

By default, POIs for track distance are added to GPX
But when this flag is present, __no waypoints are generated__.

## Compatibility

Tool was tested with:

Type     | Tool                                             
---      | ---
`device` | Garmin eTrex Venture/Legend Cx
`input`  | [EasyGPS](http://http://www.easygps.com/)
`output` | http://www.strava.com/routes 
`output` | http://www.mapmyride.com/routes/
`input`  | http://www.gpsvisualizer.com/
