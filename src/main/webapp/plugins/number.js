/**
 * Sample plugin.
 */
Draw.loadPlugin(function(ui) {

	// Adds numbered toggle property
	Editor.commonVertexProperties.push({name: 'numbered', dispName: 'Numbered', type: 'int', defVal: 1, isVisible: function(state, format)
	{
		const graph = format.editorUi.editor.graph;

		return graph.view.redrawNumberShape != null;
	}, onChange: function(graph, newValue)
	{
		graph.refresh();
	}});

	const graph = ui.editor.graph;
	let enabled = true;
	
	const graphViewResetValidationState = graph.view.resetValidationState;
	
	graph.view.resetValidationState = function()
	{
		graphViewResetValidationState.apply(this, arguments);
		this.numberCounter = [];
    this.currentLevel = 0;
	};
	
	const graphViewValidateCellState = graph.view.validateCellState;
	
	graph.view.validateCellState = function(cell, recurse)
	{
		const state = graphViewValidateCellState.apply(this, arguments);
		recurse = (recurse != null) ? recurse : true;
		
		if (recurse && state != null && graph.model.isVertex(state.cell) &&
			mxUtils.getValue(state.style, 'numbered', 0) != 0)
		{
      if (this.currentLevel < mxUtils.getValue(state.style, 'numbered', 0)) {
        this.numberCounter.push(0);
      }
      else if (this.currentLevel > mxUtils.getValue(state.style, 'numbered', 0)) {
        this.numberCounter.pop();
      }
      this.currentLevel = mxUtils.getValue(state.style, 'numbered', 0);
			this.numberCounter[this.currentLevel - 1]++;
			this.redrawNumberShape(state);
		}
		
		return state;
	};
	
  const getNumberCounter = (numberCounter) => {
    console.log(numberCounter);
    const number = numberCounter.reduce((acc, cur) => {
      return acc + '.' + cur;
    });
    return number + '.';
  };
	graph.view.redrawNumberShape = function(state)
	{
		const numbered = mxUtils.getValue(state.style, 'numbered', 0) != 0;
		const value = '<div style="padding:2px;border:1px solid gray;background:yellow;border-radius:2px;">' +
			getNumberCounter(this.numberCounter) + '</div>';

		if (enabled && numbered && graph.model.isVertex(state.cell) &&
			state.shape != null && state.secondLabel == null)
		{
			state.secondLabel = new mxText(value, new mxRectangle(),
					mxConstants.ALIGN_LEFT, mxConstants.ALIGN_BOTTOM);

			// Styles the label
			state.secondLabel.size = 12;
			state.secondLabel.dialect = mxConstants.DIALECT_STRICTHTML;
			graph.cellRenderer.initializeLabel(state, state.secondLabel);
		}
		
		if (state.secondLabel != null)
		{
			if (!numbered)
			{
				state.secondLabel.destroy();
				state.secondLabel = null;
			}
			else
			{
				const scale = graph.getView().getScale();
				const bounds = new mxRectangle(state.x + state.width - 4 * scale, state.y + 4 * scale, 0, 0);
				state.secondLabel.value = value;
				state.secondLabel.state = state;
				state.secondLabel.scale = scale;
				state.secondLabel.bounds = bounds;
				state.secondLabel.redraw();
			}
		}
	};

	// Destroys the shape number
	const destroy = graph.cellRenderer.destroy;
	graph.cellRenderer.destroy = function(state)
	{
		destroy.apply(this, arguments);
		
		if (state.secondLabel != null)
		{
			state.secondLabel.destroy();
			state.secondLabel = null;
		}
	};
	
	graph.cellRenderer.getShapesForState = function(state)
	{
		return [state.shape, state.text, state.secondLabel, state.control];
	};
	
	// Extends View menu
	mxResources.parse('number=Number');

    // Adds action
    const action = ui.actions.addAction('number...', function()
    {
		enabled = !enabled;
		graph.refresh();
    });
	
    action.setToggleAction(true);
	action.setSelectedCallback(function() { return enabled; });
    
	const menu = ui.menus.get((urlParams['sketch'] == '1') ? 'extras' : 'view');
	const oldFunct = menu.funct;
	
	menu.funct = function(menu, parent)
	{
		oldFunct.apply(this, arguments);
		
		ui.menus.addMenuItems(menu, ['-', 'number'], parent);
	};
	
	// Forces refresh if file was loaded before plugin
	if (ui.getCurrentFile() != null)
	{
		graph.refresh();
	}
});
