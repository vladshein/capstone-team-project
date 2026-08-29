{{/* Expand the name of the chart. */}}
{{- define "valkey.fullname" -}}
{{- default .Chart.Name .Values.nameOverride | trunc 63 | trimSuffix "-" -}}
{{- end -}}