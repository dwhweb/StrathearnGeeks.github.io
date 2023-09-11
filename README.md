# Strathearn Geeks website

[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)

## Overview

This is the Strathearn Geeks website, as presented to Hugo. As such, there is an accompanying theme module [here](https://github.com/dwhweb/strath_geeks_theme) which contains the majority of the meat of the project in terms of HTML templates, Sass stylesheets, Javascript etc. This should be pulled down automatically as a dependency when you run the development server, or perform a build.

There is also an accompanying script to generate an .ics calendar file [here.](https://github.com/dwhweb/strath_geeks_cal) 

## Usage

You should generate an .ics file with the provided script — the generated file `strath_geeks_cal.ics` should be placed in the `static/` directory of the project root and the site should automatically parse the contents and display the current/next upcoming meetup and associated map.

The yellow information cards (When and where, etc) are generated from the front matter in `content/_index.md` and inserted into the markdown via the shortcode `{{< info_cards >}}` — additional entries in the list using the same keys will generate additional cards if need be.

Maps are also generated from the front matter — the value of `name` for each entry should be commensurate with the names used with the calendar generator so the page Javascript can display the appropriate map properly. The shortcode for the maps is `{{< maps >}}`. See below for how these names are used in code if you're working on the theme. 

## Development

If you want to work on the theme, the best approach is probably to clone the theme repository and add the following as a temporary entry in `go.mod` in the root directory of the website repository —

```
replace github.com/dwhweb/strath_geeks_theme => /path/to/local/repository
```

This way the Hugo server will use the local theme instead of pulling the remote theme.

If you're working on debugging the associated Javascript and changing the date on your system is causing SSL certificate issues that prevent remote resources from loading, you can temporarily disable OCSP stapling in Firefox by going to `about:config` and setting `security.ssl.enable_ocsp_stapling` to `false`. 

Location names from the calendar file and front matter are brought in line with each other by doing the equivalent of the [anchorize](https://gohugo.io/functions/anchorize/) function in Hugo, that is, cast to lowercase and have all spaces replaced with - (e.g. `the Coorie Inn` becomes `the-coorie-inn`). This allows these values to be used in HTML id attributes and the Javascript to hook into the HTML that Hugo generates. 
