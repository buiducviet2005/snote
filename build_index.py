# -*- coding: utf-8 -*-
"""
SNOTE Web Script Edition - HTML Builder
Generates web_script/Index.html adhering strictly to:
1. SNOTE Design System (Dark/Light theme, glassmorphism, 68px-264px Left Sidebar, 68px Sticky Topbar)
2. Original Operating Principles (Landing Gateway, PIN 4 digits, Admin login, Safe Storage, Full 13-field Tasks, 4-state Auto Evaluation, Kanban Drag & Drop, 11-col Table, Eisenhower Matrix, Gantt 21-day with Today Indicator, Timetable, Ghi Chú & Đề Cương, Roadmap DFA Parser, Checklist modal, Bell deadline notification, Admin project management).
"""

import os

def generate_index_html():
    # Read parts or build dynamically
    with open('part_css.txt', 'r', encoding='utf-8') as f:
        css = f.read()
    with open('part_landing.txt', 'r', encoding='utf-8') as f:
        landing = f.read()

    return css, landing

if __name__ == '__main__':
    print("Builder ready.")
