using FluentValidation;

namespace EsnApp.Application.News.UpdateNewsItemStatus;

public class UpdateNewsItemStatusCommandValidator
    : AbstractValidator<UpdateNewsItemStatusCommand>
{
    public UpdateNewsItemStatusCommandValidator()
    {
        RuleFor(command => command.Id).NotEmpty();
        RuleFor(command => command.Status).IsInEnum();
    }
}
